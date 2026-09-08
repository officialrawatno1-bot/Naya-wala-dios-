import socket, threading, sys

def pipe(src, dst):
    try:
        while True:
            data = src.recv(4096)
            if not data: break
            dst.sendall(data)
    except Exception:
        pass
    finally:
        try: src.close()
        except: pass
        try: dst.close()
        except: pass

def main():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('0.0.0.0', 9000))
    server.listen(15)
    while True:
        client, _ = server.accept()
        try:
            target = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            target.connect(('127.0.0.1', 8000))
            threading.Thread(target=pipe, args=(client, target), daemon=True).start()
            threading.Thread(target=pipe, args=(target, client), daemon=True).start()
        except Exception:
            client.close()

if __name__ == '__main__':
    main()
