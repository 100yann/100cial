document.addEventListener('DOMContentLoaded', function() {
    const likeButton = document.querySelectorAll('#like')
    
    likeButton.forEach((element) => {

        // Get current status of likes
        const parentElement = element.parentElement;
        const currentLikes = parentElement.querySelector('#num-likes')


        const postId = element.getAttribute('data-post-id');
        const csrfToken = document.querySelector('input[name=csrfmiddlewaretoken]').value;
        
        const headers = {
            'X-CSRFToken': csrfToken,
        };

        fetch(`/like/${postId}`, {
            method: 'GET',
            headers: headers,
        })
        .then(response => response.json())
        .then(data => {
            if (data.found === true){
                userLiked = true
                element.textContent = 'Unlike'
            } else {
                userLiked = false
                element.textContent = 'Like'
            }
        }).catch(error => {
            console.error('Error:', error)
    })

        element.onclick = () => {
            fetch(`/like/${postId}`,{
                method: 'PUT',
                headers: headers,
            })
            .then(response => response.json())
            .then(data => {
                if (data.found === true){
                    currentLikes.textContent = parseInt(currentLikes.textContent) + 1
                    element.textContent = 'Unlike'
                } else {
                    currentLikes.textContent = parseInt(currentLikes.textContent) - 1
                    element.textContent = 'Like'
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    })
})
