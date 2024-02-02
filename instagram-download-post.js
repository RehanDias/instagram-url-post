// Import the Axios library for making HTTP requests
const axios = require("axios");

// Instagram API base URL for fetching user feed
const baseFeedUrl = "https://www.instagram.com/api/v1/feed/user/";

// User-specific cookies and headers for authentication
const cookie = '...';  // Replace with actual cookie values
const userAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";

// Headers to be included in the request
const headers = {
  Cookie: cookie,
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  "User-Agent": userAgent,
  "Viewport-Width": "430",
  "X-Asbd-Id": "129477",
  "X-Ig-App-Id": "1217981644879628",
  "X-Ig-Www-Claim": "hmac.AR38bJjwvCYi8tKF_9I5XYtMbWh91oYFvuO9h7H9Dq1eIpCm",
  "X-Requested-With": "XMLHttpRequest",
};

// Function to fetch user ID from the initial endpoint
function fetchUserId(username) {
  // Construct the URL to fetch user ID
  const initialFeedUrl = `${baseFeedUrl}${username}/username/?count=12`;

  // Log the URL being used in the request
  console.log("Fetching URL:", initialFeedUrl);

  // Make the request to fetch user ID
  return axios
    .get(initialFeedUrl, { headers: headers })
    .then((response) => {
      const data = response.data;
      // Check if user ID is available in the response
      if (data.user && data.user.pk_id) {
        return data.user.pk_id;
      } else {
        throw new Error("Error: Unable to get user ID from the response.");
      }
    })
    .catch((error) => {
      // Log and propagate the error if fetching user ID fails
      console.error("Error fetching user ID:", error.message);
      throw error;
    });
}

// Function to fetch feed with user_id and max_id
function fetchFeed(userId, maxId = null, postNumber = 1) {
  // Construct the URL to fetch user feed
  let feedUrl = `${baseFeedUrl}${userId}/?count=12`;

  // Add max_id if available
  if (maxId) {
    feedUrl += `&max_id=${maxId}`;
  }

  // Make the request to fetch user feed
  axios
    .get(feedUrl, { headers: headers })
    .then((response) => {
      const data = response.data;

      // Check if there are items in the response
      if (data.items && data.items.length > 0) {
        // Iterate through each item in the feed
        data.items.forEach((item, index) => {
          // Calculate the post index
          const postIndex = postNumber + index;
          const username = item.user.username;

          // Log information about the post
          console.log(`Post Number ${postIndex} by ${username}`);

          // Check if the post is a carousel (multiple images/videos)
          if (item.carousel_media && item.carousel_media.length > 0) {
            const processedItems = [];

            // Iterate through each item in the carousel
            item.carousel_media.forEach((carouselItem, carouselIndex) => {
              // Check if the carousel item is a video
              if (
                carouselItem.video_versions &&
                carouselItem.video_versions.length > 0
              ) {
                // Log the video URL if available
                const videoUrl = carouselItem.video_versions[0].url;
                console.log("Video URL (Carousel Video):", videoUrl);
              } else if (carouselItem.image_versions2) {
                // Log the image URL if it's the last item in the carousel
                const imageUrl = carouselItem.image_versions2.candidates[0].url;
                const isLastItem =
                  carouselIndex === item.carousel_media.length - 1;

                if (isLastItem) {
                  const postedOn = getFormattedDateTime(
                    carouselItem.taken_at,
                    carouselIndex === 0
                  );
                  console.log("Image URL (Carousel Image):", imageUrl);
                  processedItems.push({ imageUrl, postedOn, item });
                } else {
                  console.log("Image URL (Carousel Image):", imageUrl);
                }

                // Call function to print like and comment info for carousel item
                printLikeAndCommentInfo(carouselItem);
              }
            });

            // Call function to print like and comment info for the main item
            printLikeAndCommentInfo(item);

            // Additional statements after processing all items in carousel_media
            const mainItemPostedOn = getFormattedDateTime(
              item.carousel_media[0].taken_at
            );
            console.log("POSTED ON:", mainItemPostedOn);
            console.log();
            //only get one URL from the post
          } else if (item.video_versions && item.video_versions.length > 0) {
            // Log the video URL for a single video post
            const videoUrl = item.video_versions[0].url;
            const postedOn = getFormattedDateTime(item.taken_at);
            console.log("Video URL (Single Video):", videoUrl);

            // Call function to print like and comment info for the post
            printLikeAndCommentInfo(item);
            console.log("POSTED ON:", postedOn);
            console.log();
          } else if (item.image_versions2) {
            // Log the image URL for a single image post
            const imageUrl = item.image_versions2.candidates[0].url;
            const postedOn = getFormattedDateTime(item.taken_at);
            console.log("Image URL (Single Image):", imageUrl);

            // Call function to print like and comment info for the post
            printLikeAndCommentInfo(item);
            console.log("POSTED ON:", postedOn);
            console.log();
          }
        });
      }

      // Check if there is a next_max_id for the next request
      const nextMaxId = data.next_max_id;
      if (nextMaxId) {
        // If available, call the function again to get the next set of data
        fetchFeed(userId, nextMaxId, postNumber + data.items.length);
      }
    })
    .catch((error) => {
      // Log and propagate the error if fetching feed fails
      console.error("Error fetching feed:", error.message);
    });
}

// Function to print like and comment information
function printLikeAndCommentInfo(item) {
  // Check if like count is available and log it
  if (item.like_count) {
    console.log("=================================");
    console.log("Total Likes:", item.like_count);
  }

  // Check if caption text is available and log it
  if (item.caption && item.caption.text) {
    console.log("Comments:", item.caption.text);
  }
}

// Function to format timestamp to a human-readable date and time in Jakarta timezone
function getFormattedDateTime(timestamp) {
  const jakartaOffset = 7 * 60 * 60;
  const jakartaTime = new Date((timestamp + jakartaOffset) * 1000);
  const formattedDateTime = jakartaTime
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
  return formattedDateTime;
}

// Replace 'rehandiazz' with the actual username
const username = "rehandiazz";

// Call the function to fetch user ID
fetchUserId(username)
  .then((userId) => {
    // Call the function to fetch the feed without max_id initially
    fetchFeed(userId);
  })
  .catch((error) => {
    // Log and propagate the error if fetching user ID fails
    console.error("Error:", error.message);
  });
