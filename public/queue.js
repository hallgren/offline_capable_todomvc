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

var postDataFromQueue = function(callbackOk, callbackError){
  
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
        callbackError();  
      }
    }); 
  }

  function postQueueItem(queueItem, callbackOk, callbackError) {

    post(queueItem.href, "title="+queueItem.data.value+"&id="+queueItem.id, function(html){
      // do callback when ready
      callbackOk();
    }, function(errorStatus){
      
      if (queueItem.onlineAction) {
        if (queueItem.onlineAction == "addNewTodo") {
          //queue.removeOnlineAction();
          queue.splice(0);
          addNewTodoOffline({"currentTarget": {"action": queueItem.href, "method": queueItem.method}, "target": [{"value": queueItem.data.value}], "preventDefault": function(){}});
          
          var customEvent = new CustomEvent('offline', {bubbles: true, cancelable: true});
          window.dispatchEvent(customEvent);
        }
      }

      callbackError();
      
    });

  };


  var q = queue.all();
  if (q && q.length > 0) {
    loopArray(q);
  }
  else {
    // if (callbackOk) {
    //   callbackOk();
    // }
  }
  
};

postDataFromQueue(function(){
  var customEvent = new CustomEvent('todo-list-update', {bubbles: true, cancelable: true});
  window.dispatchEvent(customEvent);
});