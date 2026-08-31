import http.server
import urllib.request
import socketserver
import json

PORT = 3000
TWITCH_CLIENT = 'kimne78kx3ncx6brgo4mv6wki5h1ko'

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="public", **kwargs)

    def do_POST(self):
        if self.path == '/api/gql':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            req = urllib.request.Request('https://gql.twitch.tv/gql', data=post_data, headers={
                'Host': 'gql.twitch.tv',
                'Client-ID': TWITCH_CLIENT,
                'Content-Type': 'application/json'
            })
            
            try:
                with urllib.request.urlopen(req) as response:
                    self.send_response(response.status)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(response.read())
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"[Python Server] http://localhost:{PORT}")
    httpd.serve_forever()
