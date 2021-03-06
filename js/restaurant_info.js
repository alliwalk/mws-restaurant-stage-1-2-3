let restaurant;
var newMap;


/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoiYWxsaXdhbGsiLCJhIjoiY2ppYWo4bnZ4MTd1cjN2bXJyNmdkamVwaSJ9.9liZwOLsK2gpRS4JEgJa2g',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  /* Image optimization snippets taken from: https://github.com/redragonx/mws-restaurant-stage-1/blob/master/app/js/main.js
  and
  https://github.com/fgiorgio/mws-restaurant-stage-1/blob/master/js/main.js
  Nov 21, 2018
  */
  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.title = restaurant.name;
  const imgUrl = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = "Image for " + restaurant.name;
  const img1x = imgUrl+".jpg";
  image.src = img1x;
  image.srcset = (imgUrl + "_400"+".webp" + " 400w", imgUrl + "_400"+".jpg"+ " 400w", imgUrl+".webp");


  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  // fill reviews
  console.log('populate reviews');

  DBHelper.getReviewsById(restaurant.id, (error, reviews) => {
    if (error) {
      callback (error, null)
    } else {
      fillReviewsHTML(reviews);
    }
  })

}


/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

var submitButton = document.getElementById('submit-button');
submitButton.onclick = addReview;

var idb_request;

function addReview() {
  console.log('submit review button pressed');
  // create variables for each review element
    const id = getParameterByName('id');
    let restaurant_id = id;
    let name = document.getElementById('reviewer_name').value;
    let rating = document.getElementById('rating').value;
    let comments = document.getElementById('comment_text').value;
    const review = [{
        restaurant_id: id,
        name: name,
        rating: rating,
        comments: comments
      }];
    console.log(review, id);

    // debugger;
    DBHelper.putReview(review, id);
    setFormToNothing();
}


function setFormToNothing(review){
  document.getElementById('reviewer_name').value = "";
  document.getElementById('rating').value = "" ;
  document.getElementById('comment_text').value = "";
  // see also - https://alexandroperez.github.io/mws-walkthrough/ 10/27/2018
}


/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');

  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
  }


/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  // see also - https://alexandroperez.github.io/mws-walkthrough/ 10/27/2018
  var ts = new Date(review.createdAt);
  var ps = Date.now();

  if(review.createdAt){
    date.innerHTML = ts.toLocaleString(undefined, {
    // https://www.toptal.com/software/definitive-guide-to-datetime-manipulation 11/12/2018
  	day: 'numeric',
  	month: 'numeric',
  	year: 'numeric',
  	hour: '2-digit',
  	minute: '2-digit',
    });
  } else{
    date.innerHTML = new Date(ps);
  }

  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}



/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
