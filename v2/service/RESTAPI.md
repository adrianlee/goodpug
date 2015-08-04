# REST API
+ [Authentication](#auth)
+ [Users resource](#users)
+ [Teams resource](#teams)
+ [Messages resource](#messages)
+ [Leagues resource](#leagues)

<a id="auth"></a>
## Authentication


<a id="users"></a>
## Users
### List all users
```
GET /users
```
### Get a user
```
GET /users/:id
```
### Update user info
```
PUT /users/:id
```


<a id="teams"></a>
## Teams
### List all teams
```
GET /teams
```
### Get a team
```
GET /teams/:id
```
### Update team info
```
PUT /teams/:id
```


<a id="messages"></a>
## Messages
### Send a message
```
POST /messages
POST /matches/:league/:room/messages
```
### List messages
```
GET /matches/:league/:room/messages
```
### Edit messages
Updates a message with the specified id. Know when a message is read
```
PUT /matches/:league/:room/messages/:id
```


<a id="leagues"></a>
## League
### List leagues
List leagues that the authentivated user is a member.

### List all leagues
List all leagues the authenticated user has access to or can join.

### Get a league
### Create a league
### Update a league
