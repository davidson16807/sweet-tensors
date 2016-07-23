mkfifo js;
cat sweet-tensors.sjs demo.sjs > js &
nodejs --harmony node_modules/.bin/sjs --module sweet-tensors.sjs js  > demo.js;
