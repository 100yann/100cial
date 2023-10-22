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
        const currDetails = {
            'currBirthday': document.querySelector('#details-birthday'),
            'currNationality': document.querySelector('#details-nationality'),
            'currDescription': document.querySelector('#details-description')
        }
        editProfile(userId, isDefault, currDetails)
        isDefault = true
    }
})


function editProfile(userId, isDefault, currDetails=null){
    const defaultPageDisplay = document.querySelector('#default-view')
    const editDisplay = document.querySelector('#edit-view')

    if (isDefault){
        defaultPageDisplay.style.display = 'none'
        editDisplay.style.display = 'block'
        return;
    } else {
        defaultPageDisplay.style.display = 'block'
        editDisplay.style.display = 'none'
    }

    if (currDetails){
        for (element in currDetails){
            console.log(currDetails[element])
        }
    }
    
}