const fileInput = document.querySelector("#fileInput");
const texto = document.querySelector(".desc");
fileInput.addEventListener("change", function () {
	if (fileInput.files.length) {
		texto.innerHTML = "Se seleccionó una carpeta";
	} else {
		texto.innerHTML = "No se seleccionó una carpeta";
	}
});

let verif = false;
let modal = document.getElementById("myModal");
let modalContent = document.querySelector(".modal-content");
let btn = document.querySelector("h2");
let closeBtn = document.getElementsByClassName("closeBtn")[0];

btn.onclick = function () {
	modalContent.style.animation = "expand 0.8s ease-in-out 1";
	modal.style.display = "flex";
};

closeBtn.onclick = function () {
	verif = true;
	modalContent.style.animation = "reduce 0.8s ease-in-out 1";
};

modalContent.addEventListener("animationend", function () {
	if (verif) {
		modal.style.display = "none";
		verif = false;
	}
});

let verif2 = false;
let modal2 = document.querySelector(".modal2");
let closeBtn2 = document.getElementsByClassName("closeBtn2")[0];
let modalContent2 = document.querySelector(".modal-content2");

closeBtn2.onclick = function () {
	verif2 = true;
	modalContent2.style.animation = "reduce 0.8s ease-in-out 1";
};

modalContent2.addEventListener("animationend", function () {
	if (verif2) {
		modal2.style.display = "none";
		verif2 = false;
	}
});
