const http=require('http');
const fs=require('fs');
const path=require('path');

const root=__dirname;
const port=8080;

const types={
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.css':'text/css',
  '.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pdf':'application/pdf'
};

http.createServer(function(req,res){
  let p=decodeURIComponent(req.url.split('?')[0]);
  if(p==='/')p='/control_victoria_v9.html';
  const filePath=path.join(root,p);
  if(!filePath.startsWith(root)){res.writeHead(403);res.end('Forbidden');return;}
  fs.readFile(filePath,function(err,data){
    if(err){res.writeHead(404);res.end('Not found: '+p);return;}
    const ext=path.extname(filePath).toLowerCase();
    res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream'});
    res.end(data);
  });
}).listen(port,function(){
  console.log('Servidor en http://localhost:'+port+'/control_victoria_v9.html');
});
