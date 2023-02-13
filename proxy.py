import socket
import time

target_host = "localhost"
target_ports = [8080]
proxy_port = 8069

rate_limit = 10
buffer_size = 4096

listen_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
listen_socket.bind(("", proxy_port))
listen_socket.listen(5)

request_count = 0
last_request_time = time.time()

while True:
    client_socket, client_address = listen_socket.accept()
    print("Accepted connection from {}".format(client_address))

    current_time = time.time()
    if current_time - last_request_time >= 1:
        request_count = 0
        last_request_time = current_time
    request_count += 1
    if request_count > rate_limit:
        print("Rate limit exceeded, denying request from {}".format(client_address))
        client_socket.close()
        continue

    target_port = target_ports[0]

    target_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    target_socket.connect((target_host, target_port))

    while True:
        client_data = client_socket.recv(buffer_size)
        if not client_data:
            break
        target_socket.sendall(client_data)
        target_data = target_socket.recv(buffer_size)
        if not target_data:
            break
        client_socket.sendall(target_data)

    client_socket.close()
    target_socket.close()
