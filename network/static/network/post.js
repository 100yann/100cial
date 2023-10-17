document.addEventListener('DOMContentLoaded', function() {
    
    const likeButton = document.querySelectorAll('#like')
    
    const csrfToken = document.querySelector('input[name=csrfmiddlewaretoken]').value;    
    const headers = {
        'X-CSRFToken': csrfToken,
    };

    likeButton.forEach((element) => {

        // Get current status of likes
        const parentElement = element.parentElement;
        const currentLikes = parentElement.querySelector('#num-likes')


        const postId = element.getAttribute('data-post-id');


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

    const commentButtons = document.querySelectorAll('#comment')
    
    commentButtons.forEach((element) => {
        let is_clicked = false
        element.onclick = () => {
            const elementParent = element.parentElement
            const commentField = elementParent.querySelector('#add-comment')
            if (is_clicked){
                commentField.style.display = 'none'
                is_clicked = false
            } else {
                commentField.style.display = 'block'
                is_clicked = true
            }

            const submitComment = elementParent.querySelector('#submit-comment')
            submitComment.onclick = () => {
                const postId = submitComment.getAttribute('data-post-id')
                const commentValue = elementParent.querySelector('#comment-value').value
                if (commentValue != ''){
                    fetch(`comment/${postId}`, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({
                            'comment': commentValue
                        })
                    })
                    .then(response => {
                        if (response.ok) {
                            return response.json()
                        }
                    })
                    .then(data => {
                        console.log(data.message)
                        const username = data.new_comment['user']
                        const timestamp = data.new_comment['timestamp']

                        const showComments = submitComment.parentElement;
                        let div = document.createElement('div');
                        div.innerHTML = `
                            <ul>
                                <li>${username}</li>
                                <li>${commentValue}</li>
                                <li>${timestamp}</li>
                            </ul>
                            `
                        showComments.insertBefore(div, showComments.firstChild);
                        elementParent.querySelector('#comment-value').value = ''
                    })
                    .catch(error => {
                        console.error(error)
                    })       
                }
            }   
        }
    })
})
