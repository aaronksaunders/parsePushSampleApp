function doClick(e) {
	alert($.label.text);
}

$.index.open();

if (OS_ANDROID) {
	// Android Parse Integration
	Parse = require('eu.rebelcorp.parse');
	Parse.start();

	Parse.enablePush();

	Parse.addEventListener('notificationreceive', function(e) {
		alert("notification: ", JSON.stringify(e));
	});

	Parse.addEventListener('notificationopen', function(e) {
		alert("notification: ", JSON.stringify(e));
	});
	Parse.subscribeChannel('tellmydocstest1');

	// @TODO test this
	var data = Ti.App.Android.launchIntent.getStringExtra('com.parse.Data');

	if (data) {
		try {
			var json = JSON.parse(data);
			Ti.API.info('Push Startup Data: ' + JSON.stringify(json, null, 2));
		} catch(e) {
			Ti.API.error('Push Startup Data: ERROR: ' + JSON.stringify(e, null, 2));
		}
	}

} else {

	console.log(Ti.Platform.version);

	// IOS Parse Integration
	// Check if the device is running iOS 8 or later
	if (Ti.Platform.name == "iPhone OS" && parseInt(Ti.Platform.version.split(".")[0]) >= 8) {

		// Wait for user settings to be registered before registering for push notifications
		Ti.App.iOS.addEventListener('usernotificationsettings', function registerForPush() {

			// Remove event listener once registered for push notifications
			Ti.App.iOS.removeEventListener('usernotificationsettings', registerForPush);

			Ti.Network.registerForPushNotifications({
				success : successCallback,
				error : errorCallback,
				callback : messageCallback
			});
		});

		// Register notification types to use
		Ti.App.iOS.registerUserNotificationSettings({
			types : [Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT, Ti.App.iOS.USER_NOTIFICATION_TYPE_SOUND, Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE]
		});
	}
	// For iOS 7 and earlier
	else {
		Ti.Network.registerForPushNotifications({
			// Specifies which notifications to receive
			types : [Ti.Network.NOTIFICATION_TYPE_BADGE, Ti.Network.NOTIFICATION_TYPE_ALERT, Ti.Network.NOTIFICATION_TYPE_SOUND],
			success : successCallback,
			error : errorCallback,
			callback : messageCallback
		});
	}
	function successCallback(_successResponse) {
		var parseService = require('parseREST');
		parseService.registerPush({
			body : {
				"deviceType" : "ios",
				"deviceToken" : _successResponse.deviceToken,
				"channels" : [""],
				"appIdentifier" : Titanium.App.id,
				"appName" : Titanium.App.name,
				"appVersion" : Titanium.App.version,
				"installationId" : Ti.Platform.createUUID()
			}
		}).then(function(_response) {
			Ti.API.info("IOS: parseService.registerPush -  " + JSON.stringify(_response));
		}, function(_error) {
			Ti.API.error("IOS: parseService.registerPush ERROR-  " + JSON.stringify(_error));
		});
	}

	// error callBack
	function errorCallback(e) {
		Ti.API.info("Error during registration: " + e.error);
	}

	// message callBack
	function messageCallback(e) {
		Ti.API.info('Received push: ' + JSON.stringify(e));

		Ti.API.info(JSON.stringify(e.data));

		if (e.data && e.data.alert) {
			if (!e.data.url) {
				var alertDialog = Ti.UI.createAlertDialog({
					title : e.data.title || "Alert",
					message : e.data.alert
				});
				alertDialog.show();
			} else {
				var alertDialog = Ti.UI.createAlertDialog({
					title : e.data.title || "Alert",
					message : e.data.alert,
					buttonNames : ["OK"]
				});
				alertDialog.show();
				alertDialog.addEventListener("click", function(evt) {
					//if(evt.index===0){
					//Ti.Platform.openURL(e.data.url);
					//}
				});
			}
			OS_IOS && Titanium.UI.iPhone.setAppBadge(0);
		}
	};

}
