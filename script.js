async function init(){
	toogleAboutMeBoxView(1)
	toogleContentBoxView(1)

	await new Promise(r => setTimeout(r, 10));

	document.getElementById('bookmark-1').classList.add("transitions")
	document.getElementById('bookmark-2').classList.add("transitions")
}

function toogleAboutMeBoxView(n){
	for ( let i=1; i<=4; i++ ){
		document.getElementById('about-me-box-'+i).setAttribute('style', "max-height: 25px; cursor: pointer;")
	}
	document.getElementById('about-me-box-'+n).setAttribute('style', "max-height: 75vh; cursor: default;")
}

let content_boxes = []

function toogleContentBoxView(n){
	for ( let i=1; i<=2; i++ ){
		document.getElementById('content-box-'+i).setAttribute('style', "position:fixed;top:100%; opacity: 0;")
		document.getElementById('bookmark-1').setAttribute('style', "transform: translate( calc(-50% - 25px), 0); top: -25px;")
		document.getElementById('bookmark-2').setAttribute('style', "transform: translate( calc(-50% + 25px), 0); top: -25px;")
	}
	document.getElementById('content-box-'+n).setAttribute('style', "position:static; opacity: 1;")
	if (n==1){
		document.getElementById('bookmark-1').setAttribute('style', "transform: translate( calc(-50% - 25px), 0); top: 0;")
		document.getElementById('container-header-text').innerHTML = "<h1>Projects</h1>List of the most interesting projects that I have been developing."
	}
	if (n==2 ){
		document.getElementById('bookmark-2').setAttribute('style', "transform: translate( calc(-50% + 25px), 0); top: 0;")
		document.getElementById('container-header-text').innerHTML = "<h1>Experience</h1>List of the places where I was gathering experience."
	}
}