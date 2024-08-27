import http from 'http';
import fs from 'fs/promises';
import url from 'url';
import path from 'path';
import { connectToDatabase } from './database.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function performDatabaseOperations() {
    try {
        const db = await connectToDatabase();

        const collection = db.collection('quotes');
        const [randomDocument] = await collection.aggregate([{ $sample: { size: 1 } }]).toArray();
        return randomDocument;
    } catch (err) {
        console.error('Error performing database operations', err);
    }
}

const readFile = async (path) => {
    let data;
	try{
		data = await fs.readFile(path, 'utf8');
	} catch(error){
		data = '<h1> AN ERROR JUST OCCURED </h1><p>' + error + '</p>';
	}
    return data;
}
const server = http.createServer(async (req, res) => {
    if (req.url === '/') {
        res.setHeader('Content-Type', 'text/html');
        res.statusCode = 200;
        let randomQuote = await performDatabaseOperations();
        console.log(randomQuote);
        let quote = randomQuote.Quote;
        let author = randomQuote.Author;
        let tags = randomQuote.Tags;

        let tagString = "";
        for(let n in tags){
            tagString += '<a href="/'+tags[n]+'">' + tags[n] +', </a>';
        }
        if (tagString.endsWith(', </a>')) {
            tagString = tagString.slice(0, -6) + '</a>';
        }
        tagString = tagString.replace(/-/g, ' ');
        console.log(tagString);
        const data = await fs.readFile(path.join(__dirname, 'template', 'index.html'), 'utf-8');
        console.log(typeof data);
        let modifiedData = data.replace('"This is a quote"', quote);
        modifiedData = modifiedData.replace('"This is the author"', author);
        modifiedData = modifiedData.replace('"This is the genres"', tagString);
        res.write(modifiedData);
        res.end();
    } else if(req.url === '/images'){
        res.setHeader('Content-Type', 'image/jpg');
        res.statusCode = 200;
        let backgroundImage = 'background' + String(Math.floor(Math.random() * 11) + 1) + '.jpg';
        const image = await fs.readFile(path.join(__dirname,'template','images', backgroundImage));
        res.write(image);
        res.end();
    } else {
        res.setHeader('ContentType', 'text/html');
        res.statusCode = 404;
        res.write('<h1> THIS PAGE DOES NOT EXIST </h1>');
        res.end();
    }
})

server.listen(8000);
