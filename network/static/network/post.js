document.addEventListener('DOMContentLoaded', function() {
    const likeButton = document.querySelectorAll('#like')

    likeButton.forEach((element) => {
        element.onclick = () => {
            const parentElement = element.parentElement;
            const currentLikes = parentElement.querySelector('#num-likes')

            const postId = element.getAttribute('data-post-id');
            const csrfToken = document.querySelector('input[name=csrfmiddlewaretoken]').value;
            
            const headers = {
                'X-CSRFToken': csrfToken,
                'Content-Type': 'application/json',
            };

            fetch(`/like/${postId}`,{
                method: 'PUT',
                headers: headers,
            }).then(response => {
                if (response.status === 204){
                    currentLikes.textContent = parseInt(currentLikes.textContent) - 1
                    element.textContent = 'Like'
                } else if (response.status === 200){
                    currentLikes.textContent = parseInt(currentLikes.textContent) + 1
                    element.textContent = 'Unlike'

                } else {
                    console.log('Error')
                }
            })
            
            .catch(error => {
                console.error('Error:', error);
            });
        }
    })
})
