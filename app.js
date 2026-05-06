const base_Url = "http://localhost:3002/notes";

//navbar icons
const addIcon = document.getElementById("addIcon");
const deleteIcon = document.getElementById("deleteIcon");
const markDoneIcon = document.getElementById("markDoneIcon");

//knappar
const priorityBtn = document.getElementById("priorityBtn");
const categoryBtn = document.getElementById("categoryBtn");
const sortBtn = document.getElementById("sortBtn");
const saveBtn = document.getElementById("saveBtn");
const okBtn = document.getElementById("okBtn");
const deleteYesBtn = document.getElementById("deleteYesBtn");
const deleteNoBtn = document.getElementById("deleteNoBtn");
const markDoneYesBtn = document.getElementById("markDoneYesBtn");
const markDoneNoBtn = document.getElementById("markDoneNoBtn");
const priorityPopupCard = document.querySelectorAll(".priority__popup--card");
const btn = document.querySelectorAll(".custom__select--btn");

//popups
const priorityPopup = document.getElementById("priorityPopup");
const deletePopup = document.getElementById("deletePopup");
const markDonePopup = document.getElementById("markDonePopup");
const savingPopup = document.getElementById("savingPopup");
const savingFailedPopup = document.getElementById("savingFailedPopup");
const overlay = document.getElementById("overlay");

//alternativ
const categoryAlternatives = document.querySelectorAll("#categoryList li");
const sortAlternatives = document.querySelectorAll("#customSelectList li");
const customSelect = document.getElementById("customSelect");
const priorityAlternatives = document.querySelectorAll(
  "#priorityPopupList button",
);
const selects = document.querySelectorAll(".custom__select");

//input
const createNoteTitle = document.getElementById("createNoteTitle");
const createNoteContent = document.getElementById("createNoteContent");
const createNoteSection = document.getElementById("createNoteSection");

//övrigt
const guidelinesDelete = document.getElementById("guidelinesDelete");
const guidelinesMarkDone = document.getElementById("guidelinesMarkDone");
const notesList = document.getElementById("notesList");
const home = document.getElementById("home");
const content = document.getElementById("content");
const splash = document.querySelector(".splash");

//KLASSER ----------------------------------------------------------------------

//class för API-logik:
//ska vara som en service som hanterar data och pratar med db
class NotesService {
  //skapa en baseurl variabel för att lätt återanvända:
  //static eftersom vi ska använda static metoder och då ska kunna anropa baseUrl med this.baseUrl
  static baseUrl = base_Url;

  //CRUD för att permanent spara data i db.json:

  //POST
  //tar emot ett note objekt (som vi skapar längre ner i createNote)
  static async postNote(note) {
    //kontrollera ifall allt är korrekt inmatat. Detta görs här i servicen eftersom det är mer backend-relaterat, inte i metoderna utanför som är mer UI-relaterade
    if (!note.title || !note.content || !note.category || !note.priority) {
      //om något inte är inmatat korrekt visas popup för att informera användaren
      savingFailedPopup.style.display = "flex";
      overlay.style.display = "block";
      return;
    }

    //skapa ett anrop till servern. skicka med this.baseurl och vilken metod + headers. this. syftar på variabeln i denna klass
    const response = await fetch(this.baseUrl, {
      method: "POST", //välj lämplig metod (post, put, patch, delete osv)
      headers: {
        "Content-Type": "application/json", //skicka med vilken typ datan är som ska skickas till servern, json
      },
      body: JSON.stringify(note), //gör om innehållet i note-objektet till json
    });
    //returnerar responset från json omvandlat till ett js-objekt (.json() betyder omvandlar från json till js)
    return await response.json();
  }

  //GET
  static async getNotes() {
    const response = await fetch(this.baseUrl);
    if (!response.ok) {
      throw new Error("Error fetching notes.");
    }

    return await response.json();
  }

  //GET BY ID
  static async getNoteById(id) {
    const response = await fetch(`${this.baseUrl}/${id}`);

    if (!response.ok) {
      throw new Error("Error fetching the chosen note.");
    }

    return await response.json();
  }

  // PATCH
  //tar emot id för noten vi vill uppdatera och de uppdaterade värdena
  static async patchNote(id, updatedProps) {
    //kolla om id finns
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
    console.log("Trying to delete id:", id);
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

//TILLSTÅNDSVARIABLER --------------------------------------------------------

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

//FUNKTIONER -----------------------------------------------------------------

//loadnotes är en funktion för att hämta data från db
//hämta alla notes, lägger denna metod överst för att den är mer "generell" och "gör inget specifikt" som de andra metoderna
//async eftersom vi ska prata med db.json som kan ta lite tid
async function loadNotes() {
  //ändra tillstånd på variabel eftersom vi nu har påbörjat hämtning av data, detta kan visas upp för användaren
  loading = true;
  error = ""; //nollställer erorr eftersom det kan ha andra gamla värden som inte passar här längre. sätter nytt, passande värde längre ner

  //anropa rendernotes som skriver ut loading värdet så vi ser det i UI
  renderNotes();

  //ändra tillståndsvariabler
  try {
    //tilldela data till listan från getnotes metoden via notesservice
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
  const inputTitle = createNoteTitle.value;

  //hämta inputfältet + tillhörande värde för innehållet i noten
  const inputContent = createNoteContent.value;

  //skapa ett objekt som innehåller alla variabler
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

  return result; //returnera result som kan användas i savebtn när vi sparar värdet som returneras från createnote() i result i savebtn
}

async function updateNote(id) {
  //hämta title och content (inputfälten) och deras ev nya värde.
  //hämtar inte category och priority eftersom deras värden redan satts i frisående kod ovan
  const updateTitle = createNoteTitle.value;
  const updateContent = createNoteContent.value;

  //ett tomt objekt, redo för nya values
  const updatedProps = {};
  //om title ändrats, ge nytt värde till title i updatedProps-objektet
  if (updateTitle) updatedProps.title = updateTitle;
  if (updateContent) updatedProps.content = updateContent;
  if (selectedCategory) updatedProps.category = selectedCategory;
  if (selectedPriority) updatedProps.priority = selectedPriority;

  //skicka de nya värdena till patchnote metoden i notesservice som skapar ett nytt objekt som innehåller de nya värdena
  const result = await NotesService.patchNote(id, updatedProps);

  if (!result) return;

  //töm alla inputs:
  clearInputs();
  //visa saving popup:
  showSavingPopup();
  //visa de uppdaterade notesen
  loadNotes();

  return result;
}

async function deleteNote(id) {
  await NotesService.deleteNote(id);
  loadNotes();
}

async function markNoteDone(id) {
  await NotesService.patchNote(id, { category: "Done" });
  loadNotes();
}

//rendernotes är en metod för att visa och uppdatera i UI
//filteredNotesList = notes betyder ta emot filteredNotesList om det skickas annars är notes default
function renderNotes(filteredNotesList = notes) {
  //ändra tillståndsvariabler
  if (loading) {
    //skriv ut detta i noteslist variablen till användaren om loading är true OCH ifall listan är tom (alltså första gången innan man har flera notes):
    if (notes.length === 0) {
      //notesList = ul elementet vi hämtar högre upp i DOM elementen
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

  if (filteredNotesList.length === 0) {
    notesList.innerHTML = "Click + to create your first note.";
    return;
  }

  //loopa genom ui elementet noteslist, skapa varje note för att kunna skriva ut listan
  filteredNotesList.forEach((n) => {
    //för varje note (n), skapa ett li html element av den
    const li = document.createElement("li");

    li.classList.add("task"); //lägger på klassen med style i css
    //ändra på innehållet i själva li, vill bara skriva ut title
    li.textContent = n.title;
    //sparar id direkt på li, så vi lätt kan hämta det via click
    li.dataset.id = n.id;

    //när man klickar på ett li ska man komma ner till ifylld note
    li.addEventListener("click", () => {
      clearInputs();

      if (markBtn) {
        //spara data-id på li som man markerar att radera
        deleteSelectedNoteId = li.dataset.id;

        //fråga om det stämmer att man vill radera noten med title ...
        document.querySelector(".delete__popup--confirmation p").textContent =
          `Are you sure you want to delete '${n.title}'?`;
        // visa delete-popup
        deletePopup.style.display = "flex";
        overlay.style.display = "block";
        markBtn = false;
        guidelinesDelete.style.display = "none";
      } else if (markDoneBtn) {
        //spara id på noten man väljer att markera som klar
        markDoneSelectedNoteId = li.dataset.id;

        document.querySelector(".markDone__popup--confirmation p").textContent =
          `Are you sure you want to mark '${n.title}' as done?`;
        //visa markdone-popup
        markDonePopup.style.display = "flex";
        overlay.style.display = "block";
        markDoneBtn = false;
        guidelinesMarkDone.style.display = "none";
      } else {
        //spara data-id på li som man markerar att uppdatera
        updateSelectedNoteId = li.dataset.id;
        // fyll i title och content med befintliga värden från noten man vill redigera, så användaren ser vad som redan är inskrivit sedan förra gången
        createNoteTitle.value = n.title;
        createNoteContent.value = n.content;
        categoryBtn.textContent = n.category;
        priorityBtn.textContent = n.priority;
        //scrolla ner till relevant plats för att se sin note
        createNoteSection.scrollIntoView({ behavior: "smooth" });
      }
    });
    //lägg på li elementet i listan i html
    notesList.appendChild(li);
  });
}

//funktion för att visa popup efter man sparar, kalla på den i andra metoder efter vi sparar
function showSavingPopup() {
  savingPopup.style.display = "flex";
  overlay.style.display = "block";

  setTimeout(() => {
    savingPopup.style.display = "none";
    overlay.style.display = "none";
    home.scrollIntoView({ behavior: "smooth" });
  }, 1500);
}

//funktion för att rensa gamla värden, kalla på den i andra metoder efter vi sparar
function clearInputs() {
  //töm värden i inputfält
  createNoteTitle.value = "";
  createNoteContent.value = "";
  selectedCategory = "";
  selectedPriority = "";
  updateSelectedNoteId = "";
  //återställ category och priority-knapparna till originaltext
  categoryBtn.textContent = "Category";
  priorityBtn.textContent = "Prioritize";
}

function sortFilter(selectedFilter) {
  //filtrera notes och jämför värdena från inkommande parameter
  const filteredNotes = notes.filter(
    (n) => n.category === selectedFilter || n.priority === selectedFilter,
  );
  //returnera de filtrerade notesen
  return filteredNotes;
}

//EVENTS -----------------------------------------------------------------------------

//bättre att använda addeventlistener i js filen än att kalla på en js funktion i html elementet eftersom vi då separarerar koden och delar upp html och js för sig

priorityBtn.addEventListener("click", () => {
  priorityPopup.style.display = "flex";
  overlay.style.display = "block";
});

priorityPopupCard.forEach((btn) => {
  btn.addEventListener("click", () => {
    priorityPopup.style.display = "none";
    overlay.style.display = "none";
  });
});

deleteIcon.addEventListener("click", () => {
  markBtn = true;
  markDoneBtn = false;
  guidelinesDelete.style.display = "block";
  guidelinesMarkDone.style.display = "none";
});

//clickevent för markera note som klar
markDoneIcon.addEventListener("click", () => {
  markDoneBtn = true;
  markBtn = false;
  guidelinesMarkDone.style.display = "block";
  guidelinesDelete.style.display = "none";
});

//click event på att redirect från add button ner till att fylla i sin note
addIcon.addEventListener("click", () => {
  clearInputs();
  createNoteSection.scrollIntoView({ behavior: "smooth" });
});

//clickevent för yesbtn - DELETE POPUP
deleteYesBtn.addEventListener("click", () => {
  deleteNote(deleteSelectedNoteId);
  deletePopup.style.display = "none";
  overlay.style.display = "none";
});

//clickevent för nobtn - DELETE POPUP
deleteNoBtn.addEventListener("click", () => {
  deletePopup.style.display = "none";
  overlay.style.display = "none";
});

//clickevent för yesbtn - MARK DONE POPUP
markDoneYesBtn.addEventListener("click", () => {
  markNoteDone(markDoneSelectedNoteId);
  markDonePopup.style.display = "none";
  overlay.style.display = "none";
});

//clickevent för nobtn - MARK DONE POPUP
markDoneNoBtn.addEventListener("click", () => {
  markDonePopup.style.display = "none";
  overlay.style.display = "none";
});

//clickevent för nobtn - SAVINGFAILED POPUP
okBtn.addEventListener("click", () => {
  savingFailedPopup.style.display = "none";
  overlay.style.display = "none";
});

//clickevent för overlay (mörk bakgrund när popup syns). clicka utanför card/popup (alltså på overlay) och detta händer (döljer popup + overlay):
overlay.addEventListener("click", () => {
  deletePopup.style.display = "none";
  markDonePopup.style.display = "none";
  priorityPopup.style.display = "none";
  savingFailedPopup.style.display = "none";
  overlay.style.display = "none";
});

//här sätts valet för category
//för varje categori (li), lägg till ett click event
categoryAlternatives.forEach((li) => {
  li.addEventListener("click", () => {
    //innehållet av den li man klickar på, läggs i selectedCategory (li är categorin, textcontent är innehållet i category, alltså vilken category man valde)
    selectedCategory = li.textContent;
    //ersätter texten på knappen med det valda värdet
    categoryBtn.textContent = selectedCategory;
  });
});

//välj vad du vill sortera
sortAlternatives.forEach((li) => {
  li.addEventListener("click", () => {
    sortBtn.textContent = li.textContent;

    if (li.textContent === "All") {
      renderNotes(notes); //returnera hela listan med alla notes ifall category är All
    } else {
      const filtered = sortFilter(li.textContent);
      renderNotes(filtered); //returnera de filtrerade notesen
    }
  });
});

//här sätts valet för priority
//för varje priority (btn), lägg till ett click event
priorityAlternatives.forEach((btn) => {
  btn.addEventListener("click", () => {
    //innehållet av den btn man klickar på, läggs i selectedPriority (btn är priority, value är innehållet i priority, alltså vilken priority man valde)
    selectedPriority = btn.value;
    //ersätter texten på knappen med det valda värdet
    priorityBtn.textContent = selectedPriority;
  });
});

//när man klickar på savebtn kontrolleras ifall det är en befintlig note som redigeras eller ifall det är en ny note som skapas
saveBtn.addEventListener("click", async () => {
  let result;

  if (updateSelectedNoteId) {
    result = await updateNote(updateSelectedNoteId); //anropa updatenote ifall id är updateSelectedNoteId, alltså när man vill updatera en befintlig note
  } else {
    result = await createNote(); //annars anropa createnote för att skapa en ny note
  }

  //scrolla bara upp till start om result är giltigt
  if (result) {
    content.scrollIntoView({ behavior: "smooth" });
  }
});

splash.addEventListener("animationend", () => {
  splash.remove();
});

btn.forEach((btn) => {
  btn.addEventListener("click", () => {
    const list = btn.nextElementSibling;
    if (list) {
      list.classList.toggle("open");
    }
  });
});

selects.forEach((select) => {
  select.addEventListener("mouseleave", () => {
    const customSelectList = select.querySelector("#customSelectList");
    customSelectList.classList.remove("open");
  });
});

//stäng drop down efter man har valt
document.querySelectorAll(".custom__select--list li").forEach((item) => {
  item.addEventListener("click", () => {
    const list = item.closest(".custom__select--list");
    if (list) list.classList.remove("open");
  });
});

//INITIERING ----------------------------------------------------------------

//anropa för att notes ska visas när sidan startas
loadNotes();
