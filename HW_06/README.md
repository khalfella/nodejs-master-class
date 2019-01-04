### Homework Assignment #1

#### Spawn as many http server as the number of cores in the machine

How to run:
```
node index.html
```

In another terminal run the below command to test:

```
# while (true); do curl -so - localhost:3000/hello; done
```

Expect to see different processes handling the requests.

```
We are returning:  200 {"timestamp":"2019-01-04T02:21:06.390Z","pid":553622,"message":"Hello"}
We are returning:  200 {"timestamp":"2019-01-04T02:21:06.408Z","pid":553585,"message":"Hello"}
We are returning:  200 {"timestamp":"2019-01-04T02:21:06.424Z","pid":553622,"message":"Hello"}
```
