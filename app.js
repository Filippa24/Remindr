const splash = document.querySelector(".splash");

splash.addEventListener("animationend", () => {
  splash.remove();
});

// för egen drop down:
const btn = document.querySelectorAll(".custom__select--btn");

btn.forEach((btn) => {
  btn.addEventListener("click", () => {
    const list = btn.nextElementSibling;
    if (list) {
      list.classList.toggle("open");
    }
  });
});

const selects = document.querySelectorAll(".custom__select");

selects.forEach((select) => {
  select.addEventListener("mouseleave", () => {
    const list = select.querySelector(".custom__select--list");
    list.classList.remove("open");
  });
});

//stäng drop down efetr man har valt
document.querySelectorAll(".custom__select--list li").forEach((item) => {
  item.addEventListener("click", () => {
    const list = item.closest(".custom__select--list");
    if (list) list.classList.remove("open");
  });
});

// bättre att använda addeventlistener i js filen än att kalla på en js funktion i html elementet eftersom vi separarerar koden och delar upp html och js för sig
const prioritizeBtn = document.getElementById("priorityBtn");
const priorityPopup = document.getElementById("priority-popup");

prioritizeBtn.addEventListener("click", () => {
  priorityPopup.style.display = "flex";
  document.getElementById("overlay").style.display = "block";
});

const btnClicked = document.querySelectorAll(".priority__popup--card");

btnClicked.forEach((btn) => {
  btn.addEventListener("click", () => {
    priorityPopup.style.display = "none";
    document.getElementById("overlay").style.display = "none";
  });
});

//db.json:-----------------------------------------------------

//1. npx json-server --watch db.json --port 3000 i terminalen
//2. bestäm vilken data du vill spara i db.json (detta fall "notes": [])
//3. bestäm innehållet/fälten i varje note och objektstrukturen för att skapa ett objekt, tex: { title, content, category, priority }
//4. skapa en grund av vilka metoder man kommer behöva, blir lättare att veta var man ska börja efetrsom alla metoder hänger ihop så blir det att man inte vet var man ska börja
//4. skapa tillståndsvariabler, tex noteslist som innheåller datan vi vill visa, loading och error för användarna
//5. skapa funktionerna som använder ui och användarinput/fälten vi behöver som vi bestämmer i steg 2
//6. skapa en service-klass för att tillämpa CRUD och spara datan permanent i db.json

//class för API-logik:
//ska vara som en service som hanterar data och pratar med db
class NotesService {
  //skapa en baseurl variabel för att lätt återanvända:
  //static eftersom vi ska använda static metoder och då ska kunna anropa baseUrl med this.baseUrl
  static baseUrl = "http://localhost:3002/notes";

  //CRUD för att permanent spara data i db.json:

  //POST
  //tar emot ett note objekt (som vi skapade längre ner i createNote
  static async postNote(note) {
    //kontrollera ifall allt är korrekt inmatat. Detta görs här i servicen eftersom det är mer backend-relaterat, inte i metoderna utanför som är mer UI-relaterade
    if (!note.title || !note.content || !note.category || !note.priority) {
      alert(
        "Please write a title and note. Choose category and priority before you click Save.",
      );
      return;
    }

    //skapa ett anrop till servern. skcika med this.baseurl och vilken metod + headers. this. syftar på variabeln i denna klass
    const response = await fetch(this.baseUrl, {
      method: "POST", //välj lämplig metod (post, put, patch, delete osv)
      headers: {
        "Content-Type": "application/json", //skicka med vilken typ datan är som ska skickas till servern, json
      },
      body: JSON.stringify(note), //gör om innehållet i note-objektet till json
    });
    //returnerar responset från json omvandlat till ett js-objekt (.json() betyder omvandlar från json, inte till json som det ser ut)
    return await response.json();
  }

  //GET
  static async getNotes() {
    const response = await fetch(this.baseUrl);
    if (!response.ok) {
      throw new Error("Error collecting notes.");
    }

    return await response.json();
  }

  //GET BY ID
  static async getNoteById(id) {
    const response = await fetch(`${this.baseUrl}/${id}`);

    if (!response.ok) {
      throw new Error("Error collecting the specific note.");
    }

    return await response.json();
  }

  // PATCH
  static async patchNote(id, updatedProps) {
    //kolla om värdet jag vill hämta finns
    if (!id) {
      alert("Note not found.");
      return;
    }

    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedProps),
    });
    return await response.json();
  }

  // DELETE
  static async deleteNote(id) {
    // console.log("Försöker radera id:", id);
    if (!id) {
      alert("Note not found.");
      return;
    }

    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "DELETE",
    });
    return await response.json();
  }
}

//tillståndsvariabler:
let notes = []; //listan med notes data
let loading = false;
let error = null;
let selectedCategory = ""; //variabel för att spara vald category i
let selectedPriority = ""; //variabel för att spara vald priority i
let updateSelectedNoteId = ""; //variabel för id på den valda noten att uppdatera
let deleteSelectedNoteId = ""; //variabel för id på vald note att radera
let markDoneSelectedNoteId = ""; //variabel för id på vald note att markerka som klar
let markBtn = false; //en variabel som ska hålla koll på ifall man har valt rätt knapp för att kunna fortsätta
let markDoneBtn = false; //variabel som ska hålla koll på att man måste trycka på knappen innan man kan markera ett li som klart

//click events:
document.getElementById("deleteIcon").addEventListener("click", () => {
  markBtn = true;
  markDoneBtn = false;
  document.querySelector("#guidelinesDelete").style.display = "block";
  document.querySelector("#guidelinesMarkDone").style.display = "none";
  document.querySelector("#deletePopup");
});

//clickevent för markera note som klar
document.getElementById("markDoneIcon").addEventListener("click", () => {
  markDoneBtn = true;
  markBtn = false;
  document.querySelector("#guidelinesMarkDone").style.display = "block";
  document.querySelector("#guidelinesDelete").style.display = "none";
  document.querySelector("#markDonePopup");
});

//click event på att redirect från add button ner till att fylla i sin note
document.getElementById("addIcon").addEventListener("click", () => {
  clearInputs();
  document
    .querySelector(".create__note")
    .scrollIntoView({ behavior: "smooth" });
});

//clickevent för yesbtn - DELETE POPUP
document.querySelector("#deleteYesBtn").addEventListener("click", () => {
  deleteNote(deleteSelectedNoteId);
  document.getElementById("deletePopup").style.display = "none";
  document.getElementById("overlay").style.display = "none";
});

//clickevent för nobtn - DELETE POPUP
document.querySelector("#deleteNoBtn").addEventListener("click", () => {
  document.getElementById("deletePopup").style.display = "none";
  document.getElementById("overlay").style.display = "none";
});

//clickevent för yesbtn - MARK DONE POPUP
document.querySelector("#markDoneYesBtn").addEventListener("click", () => {
  markNoteDone(markDoneSelectedNoteId);
  document.getElementById("markDonePopup").style.display = "none";
  document.getElementById("overlay").style.display = "none";
});

//clickevent för nobtn - MARK DONE POPUP
document.querySelector("#markDoneNoBtn").addEventListener("click", () => {
  document.getElementById("markDonePopup").style.display = "none";
  document.getElementById("overlay").style.display = "none";
});

//clickevent för overlay (mörk bakgrund när popup syns). clicka utanför card/popup (alltså på overlay) och detta händer (döljer popup + overlay):
document.getElementById("overlay").addEventListener("click", () => {
  document.getElementById("deletePopup").style.display = "none";
  document.getElementById("markDonePopup").style.display = "none";
  document.getElementById("priority-popup").style.display = "none";
  document.getElementById("overlay").style.display = "none";
});

//hämta alla li i listan med categories
const categoryAlternatives = document.querySelectorAll("#categoryList li");
//här sätts valet för category
//för varje categori (li), lägg till ett click event
categoryAlternatives.forEach((li) => {
  li.addEventListener("click", () => {
    //innehållet av den li man klickar på, läggs i selectedCategory (li är categorin, textcontent är innehållet i category, alltså vilken category man valde)
    selectedCategory = li.textContent;
    //ersätter texten på knappen med det valda värdet
    document.getElementById("categoryBtn").textContent = selectedCategory;
  });
});

const sortAlternatives = document.querySelectorAll("#sortList li");
sortAlternatives.forEach((li) => {
  li.addEventListener("click", () => {
    document.getElementById("sortBtn").textContent = li.textContent;

    if (li.textContent === "All") {
      renderNotes(notes);
    } else {
      const filtered = sortFilter(li.textContent);
      renderNotes(filtered); //returnera de filtrerade notesen
    }
  });
});

//hämta alla buttons i listan med priorities
const priorityAlternatives = document.querySelectorAll(
  "#priorityPopupList button",
);

//här sätts valet för priority
//för varje priority (btn), lägg till ett click event
priorityAlternatives.forEach((btn) => {
  btn.addEventListener("click", () => {
    //innehållet av den btn man klickar på, läggs i selectedPriority (btn är priority, value är innehållet i priority, alltså vilken priority man valde)
    selectedPriority = btn.value;
    //ersätter texten på knappen med det valda värdet
    document.getElementById("priorityBtn").textContent = selectedPriority;
  });
});

//flödet för att spara en note börjar när man klickar på knappen Save, sen dirigeras man till createnote.
document.getElementById("saveBtn").addEventListener("click", async () => {
  
  let result;

  if (updateSelectedNoteId) {
    result = await updateNote(updateSelectedNoteId); //anropa updatenote ifall id är updateSelectedNoteId, alltså när man vill updatera en befintlig note
  } else {
    result = await createNote(); //annars anropa createnote för att skapa en ny note
  }

  //scrolla bara upp till start om result är giltigt, och allt är ifyllt korrekt
  if(result) {
  document.querySelector(".content").scrollIntoView({ behavior: "smooth" });
}
});

//loadnotes är en metod för att hämta data från db
//hämta alla notes, lägger denna metod överst för att den är mer "generell" och "gör inget specifikt" osm de andra metoderna
//async eftersom vi ska prata med db.json som kan ta lite tid
async function loadNotes() {
  //ändra tillstånd på variabel eftersom vi nu har påbörjat hämtning av data, detta kan visas upp för användaren
  loading = true;
  error = ""; //nollställer erorr eftersom det kan ha andra gamla värden som inte passar här längre. sätter nytt, passande värde längre ner

  //anropa rednernotes, som skriver ut loading värdet så vi ser det i UI
  renderNotes();

  //ändra tillståndsvariabler
  try {
    //tilldela data till listan från getnotes emtoden via notesservice
    notes = await NotesService.getNotes();
  } catch (e) {
    error = "Can't load notes.";
  }

  //om vi inte fångade några fel gör detta:
  //sätt loading till false, eftersom vi lyckats ladda datan
  loading = false;
  //anropa rendernotes igen
  renderNotes(); //nu när vi har ändrat värdet på loading så kommer inte loading värdet skrivas ut, utan nu kommer listan med notes skrivas
}

async function createNote() {
  //hämta inputfältet + tillhörande värde för title
  let inputTitle = document.getElementById("createNoteTitle").value;

  //hämta inputfältet + tillhörande värde för notes
  let inputContent = document.getElementById("createNoteContent").value;

  //skapa ett objekt som innehåller alla variabler från ovan
  const result = await NotesService.postNote({
    title: inputTitle,
    content: inputContent,
    category: selectedCategory,
    priority: selectedPriority,
  });

  if (!result) return;

  //töm alla inputs:
  clearInputs();

  //visa saving popup:
  showSavingPopup();

  //för att hämta om data på nytt (och den anropar rendernotes, så skriver inte båda, bara loadnotes)
  loadNotes();

  return result; //returnera result som kan användas i savebtn när vi 
}

async function updateNote(id) {
  //hämta title och content (inputfälten) och deras ev nya värde.
  //hämtar inte category och priority eftersom deras värden redan satts i frisående kod ovan
  const updateTitle = document.getElementById("createNoteTitle").value;
  const updateContent = document.getElementById("createNoteContent").value;

  //ett tomt objekt, redo för nya values
  const updatedProps = {};
  //om title ändrats, ge nytt värde till title i updatedProps-objektet
  if (updateTitle) updatedProps.title = updateTitle;
  if (updateContent) updatedProps.content = updateContent;
  if (selectedCategory) updatedProps.category = selectedCategory;
  if (selectedPriority) updatedProps.priority = selectedPriority;

  //skicka de nya värdena till patchnote metoden i notesservice som skapar ett nytt objekt som innehåller de nya värdena
  await NotesService.patchNote(id, updatedProps);

  //töm alla inputs:
  clearInputs();

  //visa saving popup:
  showSavingPopup();
  //visa de uppdaterade notesen
  loadNotes();
}
//------------------------------
async function deleteNote(id) {
  await NotesService.deleteNote(id);
  loadNotes();
}

async function markNoteDone(id) {
  await NotesService.patchNote(id, { category: "Done" });
  loadNotes();
}

//rendernotes är en metod för att visa och uppdatera i UI
//filteredNotesList = notes betyder ta emot filteredNotesList om det skcikas annars är notes default
function renderNotes(filteredNotesList = notes) {
  //hämta listan från UI, noteslist är bara ui elementet, platsen vi visar datan i, inte själva data listan
  let notesList = document.getElementById("notesList");

  //ändra tillståndsvariabler
  if (loading) {
    //skriv ut detta i noteslist variablen till användaren om loading är true OCH ifall listan är tom (alltså första gången innan man har flera notes):
    if (notes.length === 0) {
      //innerhtml = allt mellan öppnings och stängningstaggarna. så här ersätts allt mellan taggarna till "Loading"
      notesList.innerHTML = "Loading.";
    }
    return;
  }
  if (error) {
    //om error är true skriv ut detta:
    error = "Can't load notes.";
    notesList.innerHTML = error;
    return;
  }

  //ifall loading och error är false, gör detta:

  //sätt listan som tom eftersom vi nedan skapar varje note och lägger till i listan, annars hade listan duplicerats varje gång man anropar rendernotes:
  notesList.innerHTML = "";

  //loopa genom ui elementet noteslist skapa varje note för att kunna skriva ut listan
  filteredNotesList.forEach((n) => {
    //för varje note (n), skapa ett li html element av den
    const li = document.createElement("li");
    li.classList.add("task"); //lägger på klassen med style i css
    //ändra på innehållet i själva li, vill bara skriva ut title
    li.textContent = n.title;
    //sparar id direkt på li, så vi lätt kan hämta det via click
    li.dataset.id = n.id;

    //när man klcikar på ett li ska man komma ner till ifylld note
    li.addEventListener("click", () => {
      clearInputs();

      if (markBtn) {
        //spara data-id på li som man markerar att radera
        deleteSelectedNoteId = li.dataset.id;

        //fråga om det stämmer att man vill radera noten med title ...
        document.querySelector(".delete__popup--confirmation p").textContent =
          `Are you sure you want to delete '${n.title}'?`;
        // visa delete-popup
        document.getElementById("deletePopup").style.display = "flex";
        document.getElementById("overlay").style.display = "block";
        markBtn = false;
        document.querySelector("#guidelinesDelete").style.display = "none";
      } else if (markDoneBtn) {
        //spara id på noten man väljer att markera som klar
        markDoneSelectedNoteId = li.dataset.id;

        document.querySelector(".markDone__popup--confirmation p").textContent =
          `Are you sure you want to mark '${n.title}' as done?`;
        //visa markdone-popup
        document.getElementById("markDonePopup").style.display = "flex";
        document.getElementById("overlay").style.display = "block";
        markDoneBtn = false;
        document.querySelector("#guidelinesMarkDone").style.display = "none";
      } else {
        //spara data-id på li som man markerar att uppdatera
        updateSelectedNoteId = li.dataset.id;
        // fyll i title och content med befintliga värden från noten man vill redigera, så användaren ser vad som redan är inskrivit sedan förra gången
        document.getElementById("createNoteTitle").value = n.title;
        document.getElementById("createNoteContent").value = n.content;
        document.getElementById("categoryBtn").textContent = n.category;
        document.getElementById("priorityBtn").textContent = n.priority;
        //scrolla ner till relevant plats för att se sin note
        document
          .querySelector(".create__note")
          .scrollIntoView({ behavior: "smooth" });
      }
    });
    //lägg på li elementet i listan i html
    notesList.appendChild(li);
  });
}

//funktion för att visa popu efter man sparar, kalla på den i andra metoder efter vi sparar
function showSavingPopup() {
  document.getElementById("savingPopup").style.display = "flex";
  document.getElementById("overlay").style.display = "block";

  setTimeout(() => {
    document.getElementById("savingPopup").style.display = "none";
    document.getElementById("overlay").style.display = "none";
    document.querySelector(".home").scrollIntoView({ behavior: "smooth" });
  }, 1500);
}

function clearInputs() {
  //töm värden i inputfält
  document.getElementById("createNoteTitle").value = "";
  document.getElementById("createNoteContent").value = "";
  selectedCategory = "";
  selectedPriority = "";
  updateSelectedNoteId = "";
  //återställ category och priority-knapparna till originaltext
  document.getElementById("categoryBtn").textContent = "Category";
  document.getElementById("priorityBtn").textContent = "Prioritize";
}

function sortFilter(selectedFilter) {
  //filtrera notes och jämför värdena från inkommande parameter
  const filteredNotes = notes.filter(
    (n) => n.category === selectedFilter || n.priority === selectedFilter,
  );
  //returnera de filtrerade notesen
  return filteredNotes;
}

//för att notes ska visas när sidan startas
loadNotes();
