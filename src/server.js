import express from 'express';
import bodyparser from 'body-parser';
import {MongoClient} from 'mongodb';
import path from 'path';

const articlesInfo = {
    'learn-react': {
        upvotes: 0,
        comments: []
    },
    'learn-node': {
        upvotes: 0,
        comments: []
    },
    'my-thoughts-on-resumes': {
        upvotes: 0,
        comments: []
    }
}

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyparser.json());

const withDB = async (operations, res) => {
    try{
        const client  = await MongoClient.connect('mongodb://localhost:27017', {useNewUrlParser: true});
        const db = client.db('my-blog');

        await operations(db);

        client.close();
    }
    catch(error){
        res.status(500).json({message: "Error connecting to db", error});
    }
};

//not working when trying to fetch all - findone works fine - needed to add toarray
app.get('/api/articles', async(req, res) => {
    withDB(async(db) => {
        const articles = await db.collection('articles').find({}).toArray();
        res.status(200).json(articles);
    }, res);
});

app.get('/api/articles/:name', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;

        const articleInfo = await db.collection('articles').findOne({name: articleName});
        res.status(200).json(articleInfo);    
    }, res);        
});

app.post('/api/articles/:name/upvote', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
    
        const articleInfo = await db.collection('articles').findOne({name: articleName});
        await db.collection('articles').updateOne({name: articleName}, {
            '$set':{
                upvotes: articleInfo.upvotes+1,
            },
        });
        
        const updatedArticleInfo = await db.collection('articles').findOne({name: articleName});
        res.status(200).json(updatedArticleInfo);
    }, res);    
});

app.post('/api/articles/:name/add-comment', (req, res) => {
    const {username, usercomment} = req.body;
    const articleName = req.params.name;

    withDB(async (db) => {        
        const articleInfo = await db.collection('articles').findOne({name: articleName});
        await db.collection('articles').updateOne({name: articleName}, {
            "$set": {
                comments: articleInfo.comments.concat({username, usercomment}),
            },
        });

        const updatedArticleInfo = await db.collection('articles').findOne({name: articleName});
        res.status(200).json(updatedArticleInfo);
    }, res);
    
});

app.get('/hello', (req, res) => res.send('Hello'));
app.get('/hello/:name', (req, res) => res.send(`Hello ${req.params.name}`));
app.post('hello', (req, res) => res.send('hello post'));

// app.get('/api/articles', (req, res) => res.send(articlesInfo));
// app.get('/api/articles/:name/upvote', (req, res) => {
//     const articleName = req.params.name;
//     articlesInfo[articleName].upvotes++;
//     res.status(200).send(`${articleName} now has ${articlesInfo[articleName].upvotes} upvotes!!!`)
// });

// app.post('/api/articles/:name/add-comment', (req, res) => {
//     const {username, usercomment} = req.body;
//     articlesInfo[req.params.name].comments.push({username, text});
//     res.status(200).send(articlesInfo[req.params.name]);
// })

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html' ));
});

app.listen(8000, () => {
    return console.log('Listening on port 8000');
});