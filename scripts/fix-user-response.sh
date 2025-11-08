#!/bin/bash

# Script to fix UserResponse creations in handlers.rs to use .into()

cd "$(dirname "$0")/../backend" || exit 1

# Create a backup
cp src/handlers.rs src/handlers.rs.backup

# Use perl for multiline replacements
perl -i -p0e 's/user: UserResponse \{\s+id: user\.id,\s+email: user\.email,\s+username: user\.username,\s+profile_image_url: user\.profile_image_url,\s+\}/user: user.into()/gs' src/handlers.rs

perl -i -p0e 's/Ok\(Json\(UserResponse \{\s+id: updated_user\.id,\s+email: updated_user\.email,\s+username: updated_user\.username,\s+profile_image_url: updated_user\.profile_image_url,\s+\}\)\)/Ok(Json(updated_user.into()))/gs' src/handlers.rs

perl -i -p0e 's/Ok\(Json\(UserResponse \{\s+id: user\.id,\s+email: user\.email,\s+username: user\.username,\s+profile_image_url: user\.profile_image_url,\s+\}\)\)/Ok(Json(user.into()))/gs' src/handlers.rs

echo "UserResponse fixes applied. Backup saved to src/handlers.rs.backup"
echo "Please run 'cargo check' to verify the changes."