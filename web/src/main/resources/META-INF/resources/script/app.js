
$(document).ready(function(){
    $('a[data-toggle="pill"]').on('show.bs.tab', function(e) {
        localStorage.setItem('activeTab', $(e.target).attr('href'));
    });
    var activeTab = localStorage.getItem('activeTab');
    if(activeTab){
        $('#v-pills-tab a[href="' + activeTab + '"]').tab('show');
    }
});

function refreshToken(minValidity) {
    keycloak.updateToken(minValidity).success(function(refreshed) {
        if (refreshed) {
            //output(keycloak.tokenParsed);
        } else {
            output('Token not refreshed, valid for ' + Math.round(keycloak.tokenParsed.exp + keycloak.timeSkew - new Date().getTime() / 1000) + ' seconds');
        }
    }).error(function() {
        output('Failed to refresh token');
    });
}


function output(data) {
    if (typeof data === 'object') {
        data = JSON.stringify(data, null, '  ');
    }
   document.getElementById('output').innerHTML = data;
}

function event(event) {
   document.getElementById('output').innerHTML = event;
}

var keycloak = Keycloak();
var authorization;
keycloak.onAuthSuccess = function () {
    event('Auth Success');
};

keycloak.onAuthError = function (errorData) {
    event("Auth Error: " + JSON.stringify(errorData) );
};

keycloak.onAuthRefreshSuccess = function () {
    event('Auth Refresh Success');
    document.getElementById('token64').innerHTML = keycloak.token;
   document.getElementById('refreshToken').innerHTML = JSON.stringify(keycloak.refreshTokenParsed, null, 4);
   document.getElementById('idToken').innerHTML = JSON.stringify(keycloak.idTokenParsed,null, 4);
   document.getElementById('token').innerHTML = JSON.stringify(keycloak.tokenParsed,null, 4);

};

keycloak.onAuthRefreshError = function () {
    event('Auth Refresh Error');
};

keycloak.onAuthLogout = function () {
  event('Logout');
};

keycloak.onTokenExpired = function () {
    event('Access token expired.');
    if(document.getElementById("refresh").checked) {
      refreshToken();
    }
};

// Flow can be changed to 'implicit' or 'hybrid', but then client must enable implicit flow in admin console too
var initOptions = {
    responseMode: 'fragment',
    flow: 'standard',
    onload: 'check-sso'
};

function startTimer(duration, display) {
    var timer = duration, minutes, seconds;
    setInterval(function () {
        minutes = parseInt(timer / 60, 10)
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            timer = duration;
        }
    }, 1000);
}

function loginChange(radio) {
console.log("loginChange, %o", radio);
  if(radio.id == "login" && !keycloak.authenticated) {
    console.log("Loging IN");
    keycloak.login();
  } else {
    console.log("Loging OUT");
    keycloak.logout();
  }
}

/**
*/
function secureRequest(port, path) {
    var oReq = new XMLHttpRequest();
    var url = "http://" + location.hostname +":"+port+"/" + path;
    console.log("secureRequest, hostname=%s, base=%s, path=%s, url=%s", location.hostname, port, path, url);
    oReq.open('GET', url, true);
    oReq.setRequestHeader('Authorization', 'Bearer ' + keycloak.token);
    oReq.onload = function () {
      console.log("secureRequest.onLoad, %o", oReq);
        if (oReq.readyState === oReq.DONE) {
            if (oReq.status === 200) {
            var contentWindow = document.getElementById('reply-content').contentWindow;
                contentWindow.document.write("<br>\n");
                contentWindow.document.write(oReq.responseText);
            }
        }
    };
    console.log("Send request, %s", url);
    oReq.send();
}

keycloak.init(initOptions).success(function(authenticated) {
   authorization = new KeycloakAuthorization(keycloak);
   /*
   document.getElementById('refreshToken').innerHTML = JSON.stringify(keycloak.refreshTokenParsed, null, 4);
   document.getElementById('idToken').innerHTML = JSON.stringify(keycloak.idTokenParsed,null, 4);
   */
   document.getElementById('token').innerHTML = JSON.stringify(keycloak.tokenParsed,null, 4);
   document.getElementById('token64').innerHTML = keycloak.token;
   output('Init Success (' + (authenticated ? 'Authenticated' : 'Not Authenticated') + ')');
   var fiveMinutes = Math.round(keycloak.tokenParsed.exp + keycloak.timeSkew - new Date().getTime() / 1000);
       display = document.querySelector('#time');
    startTimer(fiveMinutes, display);
  if(!authenticated) {
    console.log("Not authenticated, selected Logout button");
    document.getElementById("logout").select();
  }
  else {
    console.log("Authenticated, selected Login button");
      document.getElementById("login").select();
  }
}).error(function() {
    output('ERROR: Failed to initialize KeyCloak');
});