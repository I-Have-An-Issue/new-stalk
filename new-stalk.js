var HEADSHOT_URL = "https://www.roblox.com/headshot-thumbnail/image?userId=%d&width=150&height=150"
var scannedInstances = 0

var wait = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

var doPage = (gameid, url, cursor) => {
	return new Promise(async (resolve) => {
		var serversResponse = fetch(`https://games.roblox.com/v1/games/${gameid}/servers/Public?sortOrder=Desc&limit=100${cursor ? `&cursor=${cursor}` : ""}`)
			.then((_) => _.json())
			.then(async ({ nextPageCursor, data }) => {
				for (var i = 0; i < data.length; i++) {
					var { id, playing, maxPlayers, playerTokens, fps, ping } = data[i]
					var batchResponse = await fetch("https://thumbnails.roblox.com/v1/batch", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify(
							playerTokens.map((token) => {
								return { format: "png", requestId: `0:${token}:AvatarHeadshot:150x150:png:regular`, size: "150x150", targetId: "", token, type: "AvatarHeadShot" }
							})
						),
					})
					var batchJson = await batchResponse.json()

					for (var ii = 0; ii < batchJson.data.length; ii++) {
						var player = batchJson.data[ii]
						if (player.imageUrl == url) {
							return resolve({ id, playing, maxPlayers, fps, ping })
						}
					}

					scannedInstances++
					console.log(`[new-stalk] Scanned ${scannedInstances} instances...`)
					await wait(100)
				}

				if (!nextPageCursor) return resolve(false)
				return resolve(await doPage(gameid, url, nextPageCursor))
			})
	})
}

;(async () => {
	var locationSplit = new URL(window.location).pathname.split("/")
	var placeId = locationSplit[1] == "games" ? locationSplit[2] : prompt("Enter the Game ID")
	var userId = prompt("Enter the User ID")

	if (!placeId || !userId || isNaN(Number(placeId)) || isNaN(Number(userId))) return alert("Please enter a valid Game ID and User ID.")

	var headshotResponse = await fetch(HEADSHOT_URL.replace("%d", userId))
	var results = await doPage(placeId, headshotResponse["url"])
	if (!results) return alert("Could not find the requested user.")
	if (results.playing >= results.maxPlayers) return alert("The server is full.")
	console.log("[new-stalk] Server found! Launching game...")
	window.Roblox.GameLauncher.joinGameInstance(placeId, results.id)
})()
