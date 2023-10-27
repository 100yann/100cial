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
                element.innerHTML = '<i class="fa-solid fa-heart fa-lg button-liked"></i>'
                currentLikes.classList.add('button-liked')
            } else {
                userLiked = false
                element.innerHTML = '<i class="fa-regular fa-heart fa-lg"></i>'
                currentLikes.classList.remove('button-liked')

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
                    if (currentLikes.textContent === '0'){
                        currentLikes.removeAttribute("hidden")
                    }
                    currentLikes.textContent = parseInt(currentLikes.textContent) + 1
                    currentLikes.classList.add('button-liked')
                    element.innerHTML = '<i class="fa-solid fa-heart fa-lg button-liked"></i>'
                } else {
                    currentLikes.textContent = parseInt(currentLikes.textContent) - 1
                    currentLikes.classList.remove('button-liked')
                    element.innerHTML = '<i class="fa-regular fa-heart fa-lg"></i>'
                    if (currentLikes.textContent === '0'){
                        currentLikes.setAttribute('hidden', true)
                    }
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
            const elementParent = element.parentElement.parentElement.parentElement.parentElement

            const commentField = elementParent.querySelector('#add-comment')
            const postContents = elementParent.querySelector('.post-contents')
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
                        const userId = data.new_comment['userId']

                        const showComments = submitComment.parentElement.parentElement.querySelector('#show-comments');
                        let div = document.createElement('div');
                        div.innerHTML = `
                            <div class="post-heading">
                                <h5><a href="/user/${userId}">${username}</a></h5>
                            <p>${timestamp}</p>
                            </div>
                            <p>${commentValue}</p>
                            <hr>
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
    const editButtons = document.querySelectorAll('#edit')
    editButtons.forEach((element) =>{
        const elementParent = element.parentElement.parentElement.parentElement
        console.log(elementParent)
        element.onclick = () => editPost(elementParent, headers)
    })  
    })
})

function editPost(element, headers){
    const postId = element.querySelector('#like').getAttribute('data-post-id')
    
    const originalText = element.querySelector('#post-text')
    element.querySelector('#post-text').innerHTML = `
        <textarea id='edit-field' class='form-control'>${originalText.textContent}</textarea>
        <button id='save-edit'>Save</button>
        `
    element.querySelector('#edit').style.display = 'none'
    const textarea = element.querySelector('#edit-field');

    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);

    const saveButton = element.querySelector('#save-edit')
    saveButton.onclick = () => {
        const newText = textarea.value
        element.querySelector('#post-text').innerHTML = `${newText}`
        element.querySelector('#edit').style.display = 'block'

        fetch(`/edit/${postId}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify({
                'newText': newText
            })
        })
    }
}


