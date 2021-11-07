var heart = document.getElementsByClassName('fa fa-heart')

Array.from(heart).forEach(function(element) {
      element.addEventListener('click', function(){
        const post = this.parentNode.childNodes[1].innerText
        const likes = parseInt(this.parentNode.childNodes[3].childNodes[0].innerText)
        fetch('likes', {
          method: 'put',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            "id": post,
            "likes": likes
          })
        })
        .then(response => {
          if (response.ok) return response.json()
        })
        .then(data => {
          console.log(data)
          window.location.reload(true)
        })
      });
});