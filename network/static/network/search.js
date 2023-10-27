window.addEventListener('DOMContentLoaded', () => {
    const searchBar = document.querySelector('.search-bar')
    var name = ''
    searchBar.addEventListener('keyup', () => {
        name = searchBar.value
        fetch(`/search/${name}`, {
            method: 'GET'
        })
        .then(response => {
            if (response.ok){
                return response.json()
            }
        })
        .then(data => {
            if(data){
                const parentDiv = document.querySelector('.search-results')
                parentDiv.innerHTML = ''

                data.message.forEach(user => {
                    const profileId = user.profileId
                    const username = user.username



                    const matchingUser = document.createElement('a');
                    matchingUser.className = 'dropdown-item'
                    matchingUser.href = `/user/${profileId}`
                    matchingUser.textContent = username

                    parentDiv.insertBefore(matchingUser, parentDiv.firstChild)
                })
            }
        })
    })  

})