document.addEventListener("DOMContentLoaded", function() {
    const form = document.querySelector("form");
    
    form.addEventListener("submit", function(event) {
        event.preventDefault();
        
        const navn = document.getElementById("navn").value;
        const email = document.getElementById("email").value;
        const melding = document.getElementById("melding").value;
        
        if (navn === "" || email === "" || melding === "") {
            alert("Vennligst fyll ut alle feltene.");
            return;
        }
        
        alert("Takk for din melding, " + navn + "! Vi tar kontakt snarest.");
        form.reset();
    });
});