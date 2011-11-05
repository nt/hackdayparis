alert('bellouuu !!!')

// l'url du site sur lequel se trouve notre site
var redraw_the_web_website_url = "http://localhost:8080/"

// fonction pour ajouter un fichier js
function add_js_file(name_of_the_file){
  var s=document.createElement("script");
  s.src= redraw_the_web_website_url + name_of_the_file;
  document.body.appendChild(s)
}

// on ajoute les fichiers js
add_js_file("socket.io/socket.io.js")
add_js_file("js/jquery.js")
add_js_file("js/raphael-min.js")
add_js_file("js/json2.js")
add_js_file("js/raphael.sketchpad.js")
add_js_file("js/jscolor/jscolor.js")
add_js_file("js/farbtastic/farbtastic.js")


// fonction pour ajouter un fichier css
function add_css_file(name_of_the_file){
  var link = $("<link>")
  link.attr({
          type: 'text/css',
          rel: 'stylesheet',
          href: (redraw_the_web_website_url + name_of_the_file)
  })
  $("head").append( link )   
}

// on ajoute les css
add_css_file("js/farbtastic/farbtastic.css")
add_css_file("css/hack.css")

//$('body').prepend("<style></style>")