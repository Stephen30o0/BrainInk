# Multi-stage build for smaller image
FROM public.ecr.aws/docker/library/node:20.19.2-alpine AS builder
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter

WORKDIR /var/task

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM public.ecr.aws/docker/library/node:20.19.2-alpine AS production
COPY --from=builder /opt/extensions/lambda-adapter /opt/extensions/lambda-adapter

WORKDIR /var/task

# Copy production dependencies from builder
COPY --from=builder /var/task/node_modules ./node_modules

# Copy application code
COPY . .

# Create required directories
RUN mkdir -p uploads/images uploads/study_materials uploads/textbooks

# Remove unnecessary files
RUN rm -rf .git .gitignore README.md *.md tests/ docs/ && \
    find . -name "*.test.js" -delete && \
    find . -name "*.spec.js" -delete

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000

# Expose port
EXPOSE 10000

# Command to run the application
CMD ["node", "index.js"]
