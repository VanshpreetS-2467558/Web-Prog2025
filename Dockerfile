FROM uhinf/webprogramming:2526

# Copy your project files into the container
COPY . /website

# Remove default page from base image
RUN rm /website/public/default.html

# Create a volume and mount it in the container
VOLUME ["/website/databaseFiles"]
