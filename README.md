# Remindr

Remindr is a place to store and handle your notes. Add your notes to a category and help keep track of which to prioritize first by choosing one of three priority values. Mark notes as done or delete them when no longer needed.

Remindr started as a simple school exercise but I got carried away so now it's on my GitHub. Designed in Figma. Written using JavaScript, HTML and CSS. Data is stored and managed through a local JSON Server that acts as a REST API. 

This is the first version of Remindr. More features and improvements are already planned.

## Get started

**Requirements:**
Node.js installed

**Setup**
1. Clone repository
2. Rename db.example.json to db.json
3. Paste this into your terminal of choice:
   
   npx json-server --watch db.json --port 3002

   Feel free to change port number but remember to then also change base_Url in app.js to the same port.
4. Open index.html in your browser of choice and create your first note!
