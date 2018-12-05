Homework Assignment #1

How to run:

* Start the server `node index.js`
* On a second terminal run `curl -ks http://72.2.119.182:3000/hello`

On the server terminal you should see
```
$ node index.js
The server is listening on port 3000
The server is listening on port 3001
We are returning:  200 {"timestamp":"2018-12-05T02:16:32.871Z","message":"Hello"}
```

On the other terminal

```
$ curl -ks http://72.2.119.182:3000/hello | json -ga
{
  "timestamp": "2018-12-05T02:11:45.366Z",
  "message": "Hello"
}
$
```
