document.addEventListener('DOMContentLoaded', function(){
    const editButton = document.querySelector('#edit-profile')
    const saveButton = document.querySelector("#save-details")



    let isDefault = true
    const userId = editButton.getAttribute('data-profile-id')
    editButton.onclick = () => {
        editProfile(userId, isDefault)
        isDefault = false
    }
    saveButton.onclick = () => {
        editProfile(userId, isDefault)
        isDefault = true
    }
})


function editProfile(userId, isDefault){
    const defaultPageDisplay = document.querySelector('#default-view')
    const editDisplay = document.querySelector('#edit-view')

    const csrfToken = document.querySelector('input[name=csrfmiddlewaretoken]').value;    
    const headers = {
        'X-CSRFToken': csrfToken,
    };

    if (isDefault){
        defaultPageDisplay.style.display = 'none'
        editDisplay.style.display = 'block'
        return;
    } else {
        defaultPageDisplay.style.display = 'block'
        editDisplay.style.display = 'none'
    }


    const newBirthday = document.querySelector('#new-birthday').value
    const newNationality = document.querySelector('#new-nationality').value
    const newDescription = document.querySelector('#new-description').value

    fetch(`${userId}`, {
        method: 'PUT',
        headers: {
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
            newBirthday: newBirthday,
            newNationality: newNationality,
            newDescription: newDescription
        })
    })
    .then(response => {
        if (response.ok){
            return response.json()
        }
    })
    .then(data => {
        if (data.hasOwnProperty('newBirthday')){
            const currBirthday = document.querySelector('#user-birthday')
            currBirthday.textContent = newBirthday
        }
        if (data.hasOwnProperty('newDescription')){
            const currDescription = document.querySelector('#user-description')
            currDescription.textContent = newDescription    
        }
        if (data.hasOwnProperty('newNationality')){
            const currNationality = document.querySelector('#user-nationality')
            currNationality.textContent = data['newNationality']
        }
    })
  
}