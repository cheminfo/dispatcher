onmessage=function(a){var b,c,d=JSON.parse(a.data),e=1/0,f=-1/0;for(b=0;b<d.length;b++)for(c=0;c<d[b].length;c++)d[b][c]<e&&(e=d[b][c]),d[b][c]>f&&(f=d[b][c]);this.postMessage({min:e,max:f})};