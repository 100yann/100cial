document.addEventListener('DOMContentLoaded', function() {
    
    const csrfToken = document.querySelector('input[name=csrfmiddlewaretoken]').value;    
    const headers = {
        'X-CSRFToken': csrfToken,
    };

    const likeButton = document.querySelectorAll('#like')
    
    likeButton.forEach((element) => {

        // Get necessary elements
        const parentElement = element.parentElement;
        const currentLikes = parentElement.querySelector('#num-likes')
        const postId = element.getAttribute('data-post-id');

        // Update the number of likes for each post
        postCurrentLikes(element, currentLikes, headers, postId)
        
        // On click of like button determine if it's a like or dislike and update
        // the button accordingly 
        element.onclick = () => {
            likePost(element, currentLikes, headers, postId)
        }
    })
    

    const commentButtons = document.querySelectorAll('#comment')
    
    commentButtons.forEach((element) => {
        // Used to toggle whether to show or hide the comment section
        let is_clicked = false

        element.onclick = () => {
            // Display or hide the comment section, depending on is_clicked
            is_clicked = displayComments(element, is_clicked, headers)
        }


    const editButtons = document.querySelectorAll('#edit')
    editButtons.forEach((element) =>{
        const elementParent = element.parentElement.parentElement.parentElement
        element.onclick = () => editPost(elementParent, headers)
    })  
    })
})

// Get the current likes for each post
function postCurrentLikes(element, currentLikes, headers, postId){
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
}


// Like or dislike a post
function likePost(element, currentLikes, headers, postId){
    {
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
}


// Display comment section
function displayComments(element, is_clicked, headers){
    const elementParent = element.parentElement.parentElement.parentElement.parentElement

    const commentField = elementParent.querySelector('#add-comment')
    if (is_clicked){
        commentField.style.display = 'none'
        is_clicked = false

    } else {
        commentField.style.display = 'block'
        is_clicked = true
    }

    const submitComment = elementParent.querySelector('#submit-comment')
    // Button to submit a new comment
    submitComment.onclick = () => {
        addComment(submitComment, elementParent, headers)
    }
    return is_clicked
}


// Function to save and display a new comment
function addComment(submitComment, elementParent, headers){
        const postId = submitComment.getAttribute('data-post-id')
        const commentValue = elementParent.querySelector('#comment-value').value

        if (commentValue != ''){
            fetch(`/comment/${postId}`, {
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
                // Get the data that needs to be included in the 
                // new comment
                const username = data.new_comment['user']
                const timestamp = data.new_comment['timestamp']
                const userId = data.new_comment['userId']

                const showComments = submitComment.parentElement.parentElement.querySelector('#show-comments');
                
                // Create a new div where the comment will be
                let div = document.createElement('div');
                div.innerHTML = `
                    <div class="post-heading">
                        <h5><a href="/user/${userId}">${username}</a></h5>
                    <p>${timestamp}</p>
                    </div>
                    <p>${commentValue}</p>
                    <hr>
                    `
                // Prepend the comment so it shows up at the top of the comment section
                showComments.insertBefore(div, showComments.firstChild);

                // Clear the comment field
                elementParent.querySelector('#comment-value').value = ''
            })
            .catch(error => {
                console.error(error)
            })       
        }
    }   


// Edit an existing post
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


