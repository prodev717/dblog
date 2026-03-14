import os
import math
import json
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dblog.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'dev-secret-key-12345'
CORS(app)

db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    face_data = db.Column(db.Text, nullable=True)  # string for face login data

    blogs = db.relationship('Blog', backref='author', lazy=True)

class Blog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    image = db.Column(db.Text, nullable=True)  # base64 string or url
    para = db.Column(db.Text, nullable=False)
    likes = db.Column(db.Integer, default=0, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

with app.app_context():
    db.create_all()

# Decorator to expect user_id for simplicity (since there's no JWT specified, we can just use simple user_id headers or token for auth, but let's implement a simple user_id header for blog actions)
# Actually, let's keep it simple: pass user_id in the payload for now.
# Wait, a simple token implementation using user id.
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = request.headers.get('Authorization')
        if not user_id:
            return jsonify({'error': 'Token (user_id) is missing!'}), 401
        
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'Invalid token (user_id)'}), 401
        
        return f(user, *args, **kwargs)
    return decorated

@app.route('/')
def serve_index():
    return send_file('index.html')

@app.route('/feed')
def serve_blogs_page():
    return send_file('blogs.html')

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid input'}), 400

    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    age = data.get('age')
    face_data = data.get('face_data', '')

    if not all([email, password, name, age]):
        return jsonify({'error': 'Missing required fields'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 409

    hashed_password = generate_password_hash(password)
    
    new_user = User(
        email=email,
        password_hash=hashed_password,
        name=name,
        age=age,
        face_data=face_data
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        'message': 'User created successfully',
        'user_id': new_user.id
    }), 201

def face_distance(face1, face2):
    try:
        f1 = json.loads(face1)
        f2 = json.loads(face2)
        return math.sqrt(sum((x - y) ** 2 for x, y in zip(f1, f2)))
    except:
        return 999.0

@app.route('/signin', methods=['POST'])
def signin():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    face_data = data.get('face_data')
    
    if not email or not password or not face_data:
        return jsonify({'error': 'Missing email, password, or face data'}), 400

    user = User.query.filter_by(email=email).first()
    
    if user and check_password_hash(user.password_hash, password):
        dist = face_distance(user.face_data, face_data)
        if dist < 0.55:
            return jsonify({
                'message': 'Signed in successfully',
                'user_id': user.id,
                'name': user.name
            }), 200
        else:
            return jsonify({'error': 'Face biometric mismatch'}), 401
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/blogs', methods=['POST'])
@token_required
def create_blog(current_user):
    data = request.get_json()
    title = data.get('title')
    image = data.get('image', '')
    para = data.get('para')
    
    if not title or not para:
        return jsonify({'error': 'Missing title or para'}), 400
        
    new_blog = Blog(
        title=title,
        image=image,
        para=para,
        user_id=current_user.id
    )
    
    db.session.add(new_blog)
    db.session.commit()
    
    return jsonify({
        'message': 'Blog created successfully',
        'blog_id': new_blog.id
    }), 201

@app.route('/blogs', methods=['GET'])
def get_blogs():
    # Retrieve all blogs sorted by likes descending
    blogs = Blog.query.order_by(Blog.likes.desc()).all()
    
    result = []
    for blog in blogs:
        result.append({
            'id': blog.id,
            'title': blog.title,
            'image': blog.image,
            'para': blog.para,
            'likes': blog.likes,
            'author': blog.author.name,
            'author_id': blog.author.id
        })
        
    return jsonify(result), 200

@app.route('/blogs/<int:blog_id>/like', methods=['POST'])
@token_required
def like_blog(current_user, blog_id):
    blog = db.session.get(Blog, blog_id)
    if not blog:
        return jsonify({'error': 'Blog not found'}), 404
        
    blog.likes += 1
    db.session.commit()
    
    return jsonify({
        'message': 'Blog liked successfully',
        'likes': blog.likes
    }), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
