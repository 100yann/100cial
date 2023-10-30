document.addEventListener('DOMContentLoaded', function() {
    
    const csrfToken = document.querySelector('input[name=csrfmiddlewaretoken]').value;    
    const headers = {
        'X-CSRFToken': csrfToken,
    };

    getLikeButtons(headers)
    getCommentButtons(headers)
    getEditButtons(headers)
    const submitPost = document.getElementById('submit-post')
    if (submitPost){
        submitPost.onclick = (event) => {
            const userId = submitPost.getAttribute('data-profile-id')

            event.preventDefault()
            newPost(headers, userId)
        }  
    }
})



function newPost(headers, userId){
    const postText = document.getElementById('new-post')
    fetch(`/like/${userId}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            'post': postText.value
        })
    })
    .then(response => {
        return response.json()
    })
    .then(data => {
        const username = data['username']
        const profilePic = data['user_pfp']
        const timestamp = data['timestamp']
        const date = new Date(timestamp)
        const options = {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          };
        
        const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date).replace(/PM/, 'p.m.');
        const newPostDiv = document.createElement('div')
        const postId = data['postId']
        newPostDiv.classList = 'single-post'
        newPostDiv.innerHTML = `
            <div class="post-contents">
                <div class="post-heading">
                    <div>
                        <img id='post-pfp' src="${profilePic}" alt="profile picture">
                        <a id='author' href="{% url 'user' id=post.author.id %}">${username}</a>
                    </div>
                    <p id="post-date">${formattedDate}</p>
                </div>
                <div id="post-text">${postText.value}</div>
                
                <div class="interactions">
                    <div class="interaction-left">
                        <button id='like' data-post-id="${postId}" class="interaction"></button>
                        <span id="num-likes" hidden>0</span>
                        <button id="comment" class="interaction"><i class="fa-regular fa-comments fa-lg"></i></button>
                    </div>
                    <div class="interactions-right">
                        <button id="edit" class="interaction"><i class="fa-solid fa-pen-to-square fa-lg"></i></button>
                    </div>
                </div>
                <div id="add-comment">
                    <hr>
                    <div class="new-comment">
                        <h6>Add a comment:</h6>
                        <textarea name="text" cols="80" rows="20" class="form-control" id="comment-value" maxlength="400" required=""></textarea>                        <button id="submit-comment" data-post-id="${postId}" class="btn btn-sm btn-primary">Add Comment</button>
                    </div>
                    <div id="show-comments"></div>
                </div>
            </div>
        `
        const allPosts = document.getElementById('all-posts')
        allPosts.insertBefore(newPostDiv, allPosts.firstChild)

        // clear post textarea
        postText.value = ''
        getLikeButtons(headers)
        getCommentButtons(headers)
        getEditButtons(headers)
    })

}


// Get like buttons
function getLikeButtons(headers){
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
}

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

// Get comment buttons
function getCommentButtons(headers){
    const commentButtons = document.querySelectorAll('#comment')
    
    commentButtons.forEach((element) => {
        // Used to toggle whether to show or hide the comment section
        let is_clicked = false

        element.onclick = () => {
            // Display or hide the comment section, depending on is_clicked
            is_clicked = displayComments(element, is_clicked, headers)
        }
    })
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
    if (submitComment){
    // Button to submit a new comment
    submitComment.onclick = () => {
        addComment(submitComment, elementParent, headers)
        }
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
                const userId = data.new_comment['userId']
                const profilePic = data.new_comment['user_pfp']
                const timestamp = data.new_comment['timestamp']
                const date = new Date(timestamp)
                const options = {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  };
                
                const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date).replace(/PM/, 'p.m.');

                const showComments = submitComment.parentElement.parentElement.querySelector('#show-comments');
                
                // Create a new div where the comment will be
                let div = document.createElement('div');
                div.innerHTML = `
                    <div class="post-heading">
                        <div class="comment-heading">
                            <img id='comment-pfp' src="${profilePic}" alt="profile picture">
                            <h5><a href="/user/${userId}">${username}</a></h5>
                        </div>
                        <p>${formattedDate}</p>
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

function getEditButtons(headers){
    const editButtons = document.querySelectorAll('#edit')
    editButtons.forEach((element) =>{
        const elementParent = element.parentElement.parentElement.parentElement
        element.onclick = () => editPost(elementParent, headers)
    })  
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


