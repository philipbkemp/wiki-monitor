console.clear();
const links = document.querySelector("#mw-pages")?.querySelectorAll("a");
if ( links ) {
    links.forEach(l=>{
        let href = decodeURI(l.getAttribute("href") ?? "").replaceAll("_"," ");
        if ( href.indexOf("Wikipedia:FAQ") === -1 ) {
            href = href.replace("/wiki/","");
            console.log(href);
        }
    });
}