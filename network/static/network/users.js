window.addEventListener('DOMContentLoaded', function(){
    
    const csrfToken = document.querySelector('input[name=csrfmiddlewaretoken]').value;    
    const headers = {
        'X-CSRFToken': csrfToken,
    };

    // Get the follow button
    const followButton = document.querySelector('#follow')
    if (followButton){
        // Get the profile id
        const profileId = document.querySelector('#follow').getAttribute('data-profile-id')
        followButton.onclick = () => toggleFollowStatus(followButton, headers, profileId) 
    }
})

// Follow/ unfollow the current profile and update the text of the button
function toggleFollowStatus(element, headers, profileId){
    if (element){
        fetch(`${profileId}`, {
            method: 'PUT',
            headers: headers
        })
        .then(response => {
            if (response.ok){
                return response.json()
            }
        })
        .then(data => {
            console.log(data)
            const status = data['message']
            const numFollowers = data['num_followers']
            element.textContent = status
            const updateFollowerCount = document.querySelector('#user-followers')
            updateFollowerCount.textContent = `${numFollowers}`
            
        })
    }

}