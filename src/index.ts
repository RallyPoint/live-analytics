import * as express from "express";
import * as cors from "cors";
import * as Mysql from "promise-mysql";
import * as config from 'config';

const app = express();
var allowedOrigins = ['http://localhost:4200',
    'http://127.0.0.1:4200',
    'https://rallypoint.tech'];

const MAX_VIWER_BY_IP = 5;
const TASK_INTERVAL = 10000;
const port = 3000;

const stats: {[index:string] : {viwer:{[index:string]:number}, total: number, task: number}} = {};
const statsPromise = {};
let mysqlConnection: Mysql.Connection;

const channelReady = async (channelId) => {
    if(!statsPromise[channelId]){
        statsPromise[channelId] = new Promise((resolve,reject) => {
            mysqlConnection.query(`SELECT * FROM user_entity WHERE pseudo = '${channelId}'`).then((result)=>{
                if(!result.length){  return reject(); }
                stats[channelId] = {
                    viwer : {},
                    total: 0,
                    task : <any>setInterval(() => {
                        stats[channelId].total = Object.keys(stats[channelId].viwer).reduce((acc,ip) => {
                            return acc + stats[channelId].viwer[ip];
                        },0);
                        if(stats[channelId].total === 0){
                            clearInterval(stats[channelId].task);
                            delete statsPromise[channelId];
                        }
                    },TASK_INTERVAL)
                };
                resolve();
            },reject).catch(reject);
            return ;
        });
    }
    return statsPromise[channelId];
};

app.use(cors({
    origin: function(origin, callback){
        // allow requests with no origin
        // (like mobile apps or curl requests)
        if(!origin) return callback(null, true);
        if(allowedOrigins.indexOf(origin) === -1){
            const msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));

app.post('/:channel/stats', function (req, res) {
    return channelReady(req.params.channel).then(()=>{
        if(stats[req.params.channel].viwer[req.ip] === undefined){
            stats[req.params.channel].viwer[req.ip] = 0;
        }else{
            if(stats[req.params.channel].viwer[req.ip] >= MAX_VIWER_BY_IP){
                return res.send({
                    viwer : stats[req.params.channel].total
                });
            }
        }
        stats[req.params.channel].viwer[req.ip]++;
        const delay = Math.round(Math.random()*10000);
        setTimeout(()=>{
            if(!stats[req.params.channel]){return;}
            if(stats[req.params.channel].viwer[req.ip] <= 1){
                delete stats[req.params.channel].viwer[req.ip];
            }else {
                stats[req.params.channel].viwer[req.ip]--;
            }
        },delay+1000);

        return res.send({
            viwer : stats[req.params.channel].total
        });

    },()=>{
        res.sendStatus(404);
    }).catch(console.log);
});

app.get('/:channel/stats', (req, res) => {
    if(!stats[req.params.channel]) {
        return res.send({
            viwer : 0
        });
    }
    res.send({
        viwer : stats[req.params.channel].total
    });
});

console.log(config.get('mysql'));
Mysql.createConnection({
    host     : config.get('mysqlSlave.host'),
    user     : config.get('mysqlSlave.username'),
    password : config.get('mysqlSlave.password'),
    database : config.get('mysqlSlave.database'),
    port     : config.get('mysqlSlave.port')
}).then((session)=>{
    mysqlConnection = session;
    app.listen(port, () => {
        console.log(`Example app listening at http://localhost:${port}`)
    });
});
