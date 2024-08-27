import http from 'http';
import fs from 'fs/promises';
import url from 'url';
import path from 'path';
import { connectToDatabase } from './database.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function handleRoots(req, res) {
    try {
        const tag = String(req.url).slice(1);
        console.log(tag);

        const randomQuote = await randomTagDocument(tag);
        if (randomQuote) {
            const { Quote: quote, Author: author, Tags: tags } = randomQuote;
            
            let tagString = tags.map(tag => `<a href="/${tag}">${tag}</a>`).join(', ');

            const data = await fs.readFile(path.join(__dirname, 'template', 'index.html'), 'utf-8');
            
            // Replace placeholders in the HTML template
            let modifiedData = data.replace('"This is a quote"', quote);
            modifiedData = modifiedData.replace('"This is the author"', author);
            modifiedData = modifiedData.replace('"This is the genres"', tagString);
            
            // Send the modified HTML as the response
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(modifiedData);
            res.end();
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.write('No quote found for the specified tag.');
            res.end();
        }
    } catch (err) {
        console.error('Error handling request:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.write('Internal server error.');
        res.end();
    }
}

async function randomGeneralDocument() {
    try {
        const db = await connectToDatabase();

        const collection = db.collection('quotes');
        const [randomDocument] = await collection.aggregate([{ $sample: { size: 1 } }]).toArray();
        return randomDocument;
    } catch (err) {
        console.error('Error performing database operations', err);
    }
}

async function randomTagDocument(tag) {
    try {
        const db = await connectToDatabase();

        const collection = db.collection('quotes');
        const pipeline = [
            { $match: { Tags: tag } },  // Match documents where the tag is in the Tags array
            { $sample: { size: 1 } }    // Randomly sample one document from the matched results
        ];
        const [randomDocument] = await collection.aggregate(pipeline).toArray();
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
        let randomQuote = await randomGeneralDocument();
        let quote = randomQuote.Quote;
        let author = randomQuote.Author;
        let tags = randomQuote.Tags;
        let tagString = tags.map(tag => `<a href="/${tag}">${tag}</a>`).join(', ');
        const data = await fs.readFile(path.join(__dirname, 'template', 'index.html'), 'utf-8');
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
        await handleRoots(req, res);
    }
})

server.listen(8000);
