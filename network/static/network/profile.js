document.addEventListener('DOMContentLoaded', function(){
    
    // detect if user is not on "url/user"
    const currUrl = window.location.href;
    if (currUrl.indexOf('user') > -1 === false){
        // if a user is on a differnt url, simply return the current function
        return;
    }

    const editButton = document.querySelector('#edit-profile')
    const saveButton = document.querySelector("#save-details")

    if (editButton){
        let isDefault = true

        const userId = editButton.getAttribute('data-profile-id')
        editButton.onclick = (event) => {
            event.preventDefault();
            editProfile(userId, isDefault)
            isDefault = false
        }
        saveButton.onclick = (event) => {
            event.preventDefault();
            editProfile(userId, isDefault)
            isDefault = true
        }     
    }
})


function editProfile(userId, isDefault){
    const defaultPageDisplay = document.querySelector('#default-view')
    const editDisplay = document.querySelector('#edit-view')

    const csrfToken = document.querySelector('input[name=csrfmiddlewaretoken]').value;    

    if (isDefault){
        defaultPageDisplay.style.display = 'none'
        editDisplay.style.display = 'block'
        return;
    } else {
        defaultPageDisplay.style.display = 'block'
        editDisplay.style.display = 'none'
    }

    const newBirthday = document.querySelector('#new-birthday')
    const newNationality = document.querySelector('#new-nationality')
    const newDescription = document.querySelector('#new-description')
    const newImage = document.querySelector('#new-profile_pic')

    const formData = new FormData()
    formData.append('birthday', newBirthday.value)
    formData.append('country', newNationality.value)
    formData.append('description', newDescription.value)
    formData.append('image', newImage.files[0])

    fetch(`${userId}`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
        },
        body: formData
    })
    .then(response => {
        if (response.ok){
            return response.json()
        }
    })
    .then(data => {
        if (data.hasOwnProperty('newBirthday')){
            const currBirthday = document.querySelector('#user-birthday')
            const date = new Date(newBirthday.value);
            const monthNames = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
              ];

            const year = date.getFullYear();
            const month = date.getMonth(); // 0-based index
            const day = date.getDate();

            const formattedDate = `${monthNames[month]} ${day}, ${year}`;

            currBirthday.innerHTML = `<i class="fa-solid fa-cake-candles fa-lg mr-2"></i> ${formattedDate}`
        }
        if (data.hasOwnProperty('newDescription')){
            const currDescription = document.querySelector('#user-description')
            currDescription.textContent = newDescription.value
        }
        if (data.hasOwnProperty('newNationality')){
            const currNationality = document.querySelector('#user-nationality')
            currNationality.innerHTML = `<i class="fa-solid fa-earth-europe fa-lg mr-2"></i> ${data['newNationality']}`
        }
        if (data.hasOwnProperty('newImage')){
            const currProfilePic = document.querySelector('#user-profile-pic')
            let imagePath = data['newImage']
            const cacheBuster = new Date().getTime();
            imagePath = `${imagePath}?${cacheBuster}`;
        
            currProfilePic.src = imagePath;
        }
    })
  
}