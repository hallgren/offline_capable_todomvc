window.onload = function(){
    bind();

    window.route = window.location.pathname.replace(/\/$/, '');
    
    if (!navigator.serviceWorker) {
      if (history.pushState) {
        bindPushStateEvent(); 
      }
    }

    
};

var bindPushStateEvent = function(){
  var elements = getElementsByClassName(document, "route");
  n = elements.length;
  for (var i = 0; i < n; i++) {
    element = elements[i];  
  
    if (element.addEventListener) {
        element.addEventListener("click", reRoute);
    } else if (element.attachEvent) {
        element.attachEvent("click", reRoute);
    }
  }

  window.onpopstate = function(event) {
    window.route = event.state.route.replace(/\/$/, '');
    var customEvent = new CustomEvent('new_route', {bubbles: true, cancelable: true});
    window.dispatchEvent(customEvent); 
  };
};

var reRoute = function(event){
  window.route = event.target.pathname.replace(/\/$/, '');
  var stateObj = { route: event.target.pathname };
  history.pushState(stateObj, event.target.pathname, event.target.pathname);
  var customEvent = new CustomEvent('new_route', {bubbles: true, cancelable: true});
  window.dispatchEvent(customEvent);
  event.preventDefault();
};

var getElementsByClassName = function(node,classname) {
  if (node.getElementsByClassName) { // use native implementation if available
    return node.getElementsByClassName(classname);
  } else {
    return (function getElementsByClass(searchClass,node) {
        if ( node == null )
          node = document;
        var classElements = [],
            els = node.getElementsByTagName("*"),
            elsLen = els.length,
            pattern = new RegExp("(^|\\s)"+searchClass+"(\\s|$)"), i, j;

        for (i = 0, j = 0; i < elsLen; i++) {
          if ( pattern.test(els[i].className) ) {
              classElements[j] = els[i];
              j++;
          }
        }
        return classElements;
    })(classname, node);
  }
};

var bind = function(){
    var new_todo_form = document.getElementById("form-new_todo");
    if (new_todo_form.addEventListener) {
        new_todo_form.addEventListener("submit", addNewTodo);
    } else if (new_todo_form.attachEvent) {
        new_todo_form.attachEvent("submit", addNewTodo);
    }

    if (window.addEventListener) {
      window.addEventListener("todo-list-update", updatePartials);
      window.addEventListener("offline-sync-done", updatePartials);
    } else if (window.attachEvent) {
      window.attachEvent("todo-list-update", updatePartials);
      window.attachEvent("offline-sync-done", updatePartials);
    }

    if (window.addEventListener) {
        window.addEventListener("new_route", updatePartials);
    } else if (window.attachEvent) {
        window.attachEvent("new_route", updatePartials);
    }

};

var reBind = function(){
  var new_todo_form = document.getElementById("form-new_todo");
  if (new_todo_form.removeEventListener) {
    new_todo_form.removeEventListener("submit", addNewTodo);
  } else if (new_todo_form.detachEvent) {
    new_todo_form.detachEvent("submit", addNewTodo);
  }

  if (window.removeEventListener) {
    window.removeEventListener("todo-list-update", updatePartials);
    window.removeEventListener("offline-sync-done", updatePartials);
  } else if (window.detachEvent) {
    window.detachEvent("todo-list-update", updatePartials);
    window.detachEvent("offline-sync-done", updatePartials);
  }

  if (window.removeEventListener) {
    window.removeEventListener("new_route", updatePartials);
  } else if (window.detachEvent) {
    window.detachEvent("new_route", updatePartials);
  }
  bind();
  bindPushStateEvent();
}

var updatePartials = function(event) {
    get(window.route+"/todos", function(html) {
      var todo_list = document.getElementById("todo-list");
      todo_list.innerHTML = html;
      reBind();
    });

    get("/toggle_all", function(html) {
      var toggle_all = document.getElementById("toggle_all");
      toggle_all.innerHTML = html;
      reBind();
    });

    get(window.route+"/footer", function(html) {
      var foot = document.getElementById("foot");
      foot.innerHTML = html;
      reBind();
    });
    event.preventDefault();
};

var addNewTodo = function(event) {
    event.preventDefault();
    var href = event.currentTarget.action;
    var method = event.currentTarget.method;
    var value = event.target[0].value;
    var id = event.currentTarget.id;
    
    postData({"href": href, "method": method, "data": {"value": value}, "id": "", "onlineAction": "addNewTodo"},
      function(){
      var customEvent = new CustomEvent('todo-list-update', {bubbles: true, cancelable: true});
      window.dispatchEvent(customEvent);
    },function(queueItem){
      if (queueItem.onlineAction) {
        if (queueItem.onlineAction == "addNewTodo") {
          //queue.removeOnlineAction();
          queue.splice(0);
          addNewTodoOffline({"currentTarget": {"action": queueItem.href, "method": queueItem.method}, "target": [{"value": queueItem.data.value}], "preventDefault": function(){}});
          
          var customEvent = new CustomEvent('offline', {bubbles: true, cancelable: true});
          window.dispatchEvent(customEvent);
        }
      }
    });
    
    event.target[0].value = "";
    return false
};

var get = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

    xhr.send();

    xhr.onreadystatechange = function () {
      var DONE = 4; // readyState 4 means the request is done.
      var OK = 200; // status 200 is a successful return.
      if (xhr.readyState === DONE) {
        if (xhr.status === OK) {
          callback(xhr.responseText);
          reBind();
        } else {
          console.log('Error: ' + xhr.status); // An error occurred during the request.
        }
      }
    };
};

window.addEventListener('online',  function(){

  var new_todo_form = document.getElementById("form-new_todo");
  if (new_todo_form.addEventListener) {
      new_todo_form.addEventListener("submit", addNewTodo);
  } else if (new_todo_form.attachEvent) {
      new_todo_form.attachEvent("submit", addNewTodo);
  }
});

window.addEventListener('offline',  function(){

  //unbind event listeners
  var new_todo_form = document.getElementById("form-new_todo");
  if (new_todo_form.removeEventListener) {
      new_todo_form.removeEventListener("submit", addNewTodo);
  } else if (new_todo_form.detachEvent) {
      new_todo_form.detachEvent("submit", addNewTodo);
  }
});