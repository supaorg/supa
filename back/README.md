# Back
It's the backend of Supamind. It can run both on a dedicated http-server as well as on a client inside a web worker. Front connects to it either by http/web-socket connection or by a thin non-networked bridge using the same API.

The main goal of the back is to run user workspaces.