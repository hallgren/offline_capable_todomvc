var queue = {

  all: function(){
    return JSON.parse(localStorage.getItem("queue")) || []
  },

  push: function(item){
    var q = JSON.parse(localStorage.getItem("queue")) || [];
    q.push(item);

    localStorage.setItem("queue", JSON.stringify(q));    
  },

  splice: function(index) {
    var q = JSON.parse(localStorage.getItem("queue")) || [];
    q.splice(index, 1);

    localStorage.setItem("queue", JSON.stringify(q)); 
  },

  clear: function(){
    localStorage.setItem("queue", JSON.stringify([])); 
  },

  removeOnlineAction: function(){
    var q = JSON.parse(localStorage.getItem("queue"));
    q[0].onlineAction = null;
    localStorage.setItem("queue", JSON.stringify(q)); 
  }
};

var post = function(url, data, callbackOk, callbackError) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhr.send(data);

    xhr.onreadystatechange = function () {
      var DONE = 4; // readyState 4 means the request is done.
      var OK = 200; // status 200 is a successful return.
      if (xhr.readyState === DONE) {
        if (xhr.status === OK) {
          callbackOk(xhr.responseText);
          reBind();
        } else {
          callbackError(xhr.status);
          console.log('Error: ' + xhr.status); // An error occurred during the request.
        }
      }
    };
};

var postData = function(data, callbackOk, callbackError){
   queue.push(data);
   postDataFromQueue(callbackOk,callbackError);
};

var postDataFromQueue = function(callbackOk, callbackError, callbackOkIfNoItemsInQueue){
  
  var i = 0;
  var loopArray = function(arr) {
    // call itself
    postQueueItem(arr[i],function(){
        queue.splice(0); //Remove first item in queue

        i++;
        // any more items in array?
        if(i < arr.length) {
          loopArray(arr);   
        }
        else {
          if (callbackOk) {
            callbackOk();  
          }
        }
    }, function(){
      if (callbackError) {
        callbackError(arr[i]);  
      }
    }); 
  }

  function postQueueItem(queueItem, callbackOk, callbackError) {

    post(queueItem.href, "title="+queueItem.data.value+"&id="+queueItem.id, function(html){
      // do callback when ready
      callbackOk();
    }, function(errorStatus){
      callbackError();
    });

  };


  var q = queue.all();
  if (q && q.length > 0) {
    loopArray(q);
  }
  else if (callbackOkIfNoItemsInQueue) {
    if (callbackOk) {
      callbackOk();
    }
  }
  
};


window.addEventListener('online',  function(){

  //Make sure the connection is up
  setTimeout(postDataFromQueue(function(){
    var customEvent = new CustomEvent('offline-sync-done', {bubbles: true, cancelable: true});
    window.dispatchEvent(customEvent);
    window.intervalSendQueue = setupInterval();
  }, function(){
    window.intervalSendQueue = setupInterval();
  }, true), 500);

});

window.addEventListener('offline',  function(){
  if (window.intervalSendQueue) {
   clearInterval(window.intervalSendQueue);
  }
});

var setupInterval = function(){
  return setInterval(function(){ 
    postDataFromQueue(function(){
      var customEvent = new CustomEvent('todo-list-update', {bubbles: true, cancelable: true});
      window.dispatchEvent(customEvent);
    })}, 3000);
}

window.intervalSendQueue = setupInterval();

