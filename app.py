# Main Flask Application

import os
from flask import Flask, render_template, request, redirect, url_for
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Define the upload folder for user-uploaded images.
UPLOAD_FOLDER = os.path.join("static", "images", "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route("/")
def index():
    # Get the image filename (if an image was uploaded) from the query parameters.
    image_filename = request.args.get("image")
    if image_filename:
        # Build the URL for the uploaded image.
        image_url = url_for("static", filename="images/uploads/" + image_filename)
    else:
        # Use the default image if no uploaded image is specified.
        image_url = url_for("static", filename="images/default.jpg")
    
    # Get the desired number of pieces from the query parameters (default to 25).
    default_num_pieces = request.args.get("numPieces", 25)
    
    return render_template("index.html",
                           default_num_pieces=default_num_pieces,
                           image_url=image_url)

@app.route("/upload", methods=["POST"])
def upload():
    if "image" in request.files:
        image = request.files["image"]
        if image.filename != "":
            # Secure the filename and save the uploaded image.
            filename = secure_filename(image.filename)
            image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            # Redirect back to index, passing the uploaded image filename as a parameter.
            return redirect(url_for("index", image=filename))
    return "No image uploaded", 400

if __name__ == "__main__":
    app.run(debug=True)

