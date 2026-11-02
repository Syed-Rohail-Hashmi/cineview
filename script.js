  
    const BASE_URL = 'https://api.themoviedb.org/3';
    const IMG_URL = 'https://image.tmdb.org/t/p/w500';

    const movieGrid = document.getElementById('movie-grid');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const spinner = document.getElementById('spinner');
    const errorMsg = document.getElementById('error-msg');
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');
    const modalClose = document.getElementById('modal-close');
    const suggestionsBox = document.getElementById('suggestions');
    const genreTagsContainer = document.getElementById('genre-tags');
    const sectionTitle = document.getElementById('section-title');

    const navHome = document.getElementById('nav-home');
    const navPopular = document.getElementById('nav-popular');
    const navTopRated = document.getElementById('nav-top-rated');

    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const navMenu = document.getElementById('nav-menu');
    const loadMoreBtn = document.getElementById('load-more-btn');

    let debounceTimer;
    let clearInputBtn;

    let currentPage = 1;
    let currentEndpoint = '/movie/popular';
    let currentQueryParam = '';
    let isSearchMode = false;
    let globalGenreMap = {};

    function renderErrorState() {
        errorMsg.textContent = '';
        
        var icon = document.createElement('div');
        icon.textContent = '🎬';
        icon.style.fontSize = '32px';
        icon.style.marginBottom = '10px';
        
        var msg = document.createElement('p');
        msg.textContent = 'No movies found. Try a different search!';
        
        errorMsg.appendChild(icon);
        errorMsg.appendChild(msg);
        errorMsg.classList.remove('error-hidden');
    }

    async function fetchMovies(endpoint = '/movie/popular', customQuery = '', appendMode = false) {
        try {
            if (!appendMode) {
                spinner.classList.remove('spinner-hidden');
                errorMsg.classList.add('error-hidden');
                movieGrid.textContent = '';
                currentPage = 1;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                loadMoreBtn.textContent = 'Loading...';
                loadMoreBtn.disabled = true;
            }
            
            currentEndpoint = endpoint;
            currentQueryParam = customQuery;

            let url = BASE_URL + endpoint + '?api_key=' + API_KEY + '&page=' + currentPage;
            if (customQuery) {
                url += customQuery;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network error occurred.');
            }

            const data = await response.json();
            const moviesArray = data.results;

            if (!moviesArray || moviesArray.length === 0) {
                if (!appendMode) {
                    renderErrorState();
                    loadMoreBtn.classList.add('btn-hidden');
                }
                return;
            }

            displayMovies(moviesArray, appendMode);

            if (data.total_pages > currentPage) {
                loadMoreBtn.classList.remove('btn-hidden');
            } else {
                loadMoreBtn.classList.add('btn-hidden');
            }

        } catch (err) {
            if (!appendMode) {
                renderErrorState();
                loadMoreBtn.classList.add('btn-hidden');
            }
        } finally {
            spinner.classList.add('spinner-hidden');
            loadMoreBtn.textContent = 'Load More';
            loadMoreBtn.disabled = false;
        }
    }

    function displayMovies(moviesList, appendMode) {
        if (!appendMode) {
            movieGrid.textContent = '';
        }

        for (let i = 0; i < moviesList.length; i++) {
            const movieItem = moviesList[i];
            
            if (!movieItem.poster_path && (!movieItem.title || movieItem.vote_average === 0)) {
                continue;
            }
            
            const cardBox = document.createElement('div');
            cardBox.className = 'movie-card';

            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'card-img-wrapper';

            if (movieItem.poster_path) {
                const posterImg = document.createElement('img');
                posterImg.src = IMG_URL + movieItem.poster_path;
                posterImg.alt = movieItem.title;
                imgWrapper.appendChild(posterImg);
            } else {
                const placeholderBox = document.createElement('div');
                placeholderBox.className = 'poster-placeholder';
                
                const placeholderText = document.createElement('span');
                placeholderText.textContent = movieItem.title;
                
                placeholderBox.appendChild(placeholderText);
                imgWrapper.appendChild(placeholderBox);
            }

            const infoBox = document.createElement('div');
            infoBox.className = 'card-info';

            const ratingLabel = document.createElement('div');
            ratingLabel.className = 'card-rating';
            ratingLabel.textContent = '★ ' + (movieItem.vote_average ? movieItem.vote_average.toFixed(1) : '0.0');

            const titleText = document.createElement('h3');
            titleText.className = 'card-title';
            titleText.textContent = movieItem.title;

            const metaRow = document.createElement('div');
            metaRow.className = 'card-meta';

            const yearLabel = document.createElement('span');
            if (movieItem.release_date) {
                yearLabel.textContent = movieItem.release_date.substring(0, 4);
            } else {
                yearLabel.textContent = 'N/A';
            }
            metaRow.appendChild(yearLabel);

            if (movieItem.genre_ids && movieItem.genre_ids.length > 0) {
                const separator = document.createElement('span');
                separator.textContent = '•';
                metaRow.appendChild(separator);

                const genreLabel = document.createElement('span');
                genreLabel.className = 'card-genre-text';
                
                const namesArray = [];
                for (let g = 0; g < movieItem.genre_ids.length; g++) {
                    const gId = movieItem.genre_ids[g];
                    if (globalGenreMap[gId]) {
                        namesArray.push(globalGenreMap[gId]);
                    }
                }
                
                genreLabel.textContent = namesArray.slice(0, 2).join(', ');
                metaRow.appendChild(genreLabel);
            }

            const overviewText = document.createElement('p');
            overviewText.className = 'card-overview';
            overviewText.textContent = movieItem.overview ? movieItem.overview : 'No synopsis overview details available.';

            infoBox.appendChild(ratingLabel);
            infoBox.appendChild(titleText);
            infoBox.appendChild(metaRow);
            infoBox.appendChild(overviewText);

            cardBox.appendChild(imgWrapper);
            cardBox.appendChild(infoBox);

            cardBox.addEventListener('click', function() {
                showMovieDetailsModal(movieItem.id);
            });

            movieGrid.appendChild(cardBox);
        }
    }

    async function showMovieDetailsModal(movieId) {
        try {
            modalContent.textContent = '';
            modal.classList.remove('modal-hidden');
            document.body.style.overflow = 'hidden';

            const detailsUrl = BASE_URL + '/movie/' + movieId + '?api_key=' + API_KEY + '&append_to_response=credits,videos';
            const res = await fetch(detailsUrl);
            const movieDetails = await res.json();

            const mainContainer = document.createElement('div');
            mainContainer.className = 'modal-container';

            const leftColumn = document.createElement('div');
            leftColumn.className = 'modal-left-col';
            const detailImg = document.createElement('img');
            if (movieDetails.poster_path) {
                detailImg.src = IMG_URL + movieDetails.poster_path;
            } else {
                detailImg.src = 'https://via.placeholder.com/500x750?text=No+Image';
            }
            detailImg.alt = movieDetails.title;
            leftColumn.appendChild(detailImg);

            const rightColumn = document.createElement('div');
            rightColumn.className = 'modal-right-col';

            const headTitle = document.createElement('h2');
            headTitle.className = 'modal-title';
            headTitle.textContent = movieDetails.title;
            rightColumn.appendChild(headTitle);

            if (movieDetails.tagline) {
                const taglineText = document.createElement('p');
                taglineText.className = 'modal-tagline';
                taglineText.textContent = '"' + movieDetails.tagline + '"';
                rightColumn.appendChild(taglineText);
            }

            let directorName = 'Unknown';
            if (movieDetails.credits && movieDetails.credits.crew) {
                for (let k = 0; k < movieDetails.credits.crew.length; k++) {
                    if (movieDetails.credits.crew[k].job === 'Director') {
                        directorName = movieDetails.credits.crew[k].name;
                        break;
                    }
                }
            }
            const directorText = document.createElement('p');
            directorText.className = 'modal-director';
            directorText.textContent = 'Director: ';
            const dirSpan = document.createElement('span');
            dirSpan.textContent = directorName;
            directorText.appendChild(dirSpan);
            rightColumn.appendChild(directorText);

            const specsRow = document.createElement('div');
            specsRow.className = 'modal-meta-row';
            
            const runtimeVal = movieDetails.runtime ? movieDetails.runtime + ' mins' : 'N/A';
            const dateVal = movieDetails.release_date ? movieDetails.release_date : 'N/A';
            const voteVal = movieDetails.vote_average ? movieDetails.vote_average.toFixed(1) : '0.0';
            const totalVotes = movieDetails.vote_count ? movieDetails.vote_count.toLocaleString() : '0';

            const releaseSpan = document.createElement('span');
            releaseSpan.textContent = 'Release: ' + dateVal;

            const dot1 = document.createElement('span');
            dot1.textContent = '•';

            const runtimeSpan = document.createElement('span');
            runtimeSpan.textContent = 'Runtime: ' + runtimeVal;

            const dot2 = document.createElement('span');
            dot2.textContent = '•';

            const ratingSpan = document.createElement('span');
            ratingSpan.className = 'modal-rating-span';
            ratingSpan.textContent = '★ ' + voteVal + ' (' + totalVotes + ' votes)';

            specsRow.appendChild(releaseSpan);
            specsRow.appendChild(dot1);
            specsRow.appendChild(runtimeSpan);
            specsRow.appendChild(dot2);
            specsRow.appendChild(ratingSpan);
            rightColumn.appendChild(specsRow);

            if (movieDetails.genres && movieDetails.genres.length > 0) {
                const genresWrapper = document.createElement('div');
                genresWrapper.className = 'modal-genres-container';
                for (let g = 0; g < movieDetails.genres.length; g++) {
                    const genreBadge = document.createElement('span');
                    genreBadge.textContent = movieDetails.genres[g].name;
                    genresWrapper.appendChild(genreBadge);
                }
                rightColumn.appendChild(genresWrapper);
            }

            const synopsHeading = document.createElement('h3');
            synopsHeading.className = 'modal-section-heading';
            synopsHeading.textContent = 'Synopsis';
            rightColumn.appendChild(synopsHeading);

            const synopsContent = document.createElement('p');
            synopsContent.className = 'modal-overview-text';
            synopsContent.textContent = movieDetails.overview ? movieDetails.overview : 'Detailed profile synopsis information not provided.';
            rightColumn.appendChild(synopsContent);

            let trailerKey = '';
            if (movieDetails.videos && movieDetails.videos.results) {
                for (let v = 0; v < movieDetails.videos.results.length; v++) {
                    const videoItem = movieDetails.videos.results[v];
                    if (videoItem.site === 'YouTube' && (videoItem.type === 'Trailer' || videoItem.type === 'Teaser')) {
                        trailerKey = videoItem.key;
                        break;
                    }
                }
            }

            if (trailerKey) {
                const videoHeading = document.createElement('h3');
                videoHeading.className = 'modal-section-heading-trailer';
                videoHeading.textContent = 'Official Trailer';
                rightColumn.appendChild(videoHeading);

                const videoBox = document.createElement('div');
                videoBox.className = 'modal-video-wrapper';

                const playerFrame = document.createElement('iframe');
                playerFrame.src = 'https://www.youtube.com/embed/' + trailerKey;
                playerFrame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                playerFrame.allowFullscreen = true;

                videoBox.appendChild(playerFrame);
                rightColumn.appendChild(videoBox);
            }

            mainContainer.appendChild(leftColumn);
            mainContainer.appendChild(rightColumn);
            modalContent.appendChild(mainContainer);

        } catch (error) {
            modalContent.textContent = 'Error fetching extended details metadata info.';
        }
    }

    function closeModalWindow() {
        modal.classList.add('modal-hidden');
        modalContent.textContent = '';
        document.body.style.overflow = '';
    }

    async function fetchGenresList() {
        try {
            const genresUrl = BASE_URL + '/genre/movie/list?api_key=' + API_KEY;
            const res = await fetch(genresUrl);
            const data = await res.json();
            
            for (let g = 0; g < data.genres.length; g++) {
                globalGenreMap[data.genres[g].id] = data.genres[g].name;
            }
            
            buildGenreFilterButtons(data.genres);
        } catch (err) {
            genreTagsContainer.textContent = '';
        }
    }

    function buildGenreFilterButtons(genres) {
        genreTagsContainer.textContent = '';

        for (let i = 0; i < genres.length; i++) {
            const genre = genres[i];
            const tagButton = document.createElement('button');
            tagButton.className = 'genre-btn';
            tagButton.textContent = genre.name;

            tagButton.addEventListener('click', function() {
                clearActiveStates();
                tagButton.classList.add('active-filter');
                searchInput.value = '';
                toggleClearButton();
                isSearchMode = false;
                sectionTitle.textContent = genre.name + ' Movies';
                fetchMovies('/discover/movie', '&with_genres=' + genre.id);
                closeMobileMenu();
            });

            genreTagsContainer.appendChild(tagButton);
        }
    }

    function clearActiveStates() {
        navHome.classList.remove('active-filter');
        navPopular.classList.remove('active-filter');
        navTopRated.classList.remove('active-filter');

        const tags = genreTagsContainer.getElementsByClassName('genre-btn');
        for (let j = 0; j < tags.length; j++) {
            tags[j].classList.remove('active-filter');
        }
    }

    async function fetchLiveSearchSuggestions(searchQuery) {
        if (!searchQuery) {
            suggestionsBox.classList.add('dropdown-hidden');
            return;
        }

        try {
            const suggestUrl = BASE_URL + '/search/movie?api_key=' + API_KEY + '&query=' + encodeURIComponent(searchQuery);
            const res = await fetch(suggestUrl);
            const data = await res.json();
            const shortList = data.results ? data.results.slice(0, 6) : [];

            if (shortList.length === 0) {
                suggestionsBox.classList.add('dropdown-hidden');
                return;
            }

            suggestionsBox.textContent = '';
            for (let i = 0; i < shortList.length; i++) {
                const matchedMovie = shortList[i];
                const dropItem = document.createElement('div');
                dropItem.className = 'suggestion-item';
                dropItem.textContent = matchedMovie.title;

                dropItem.addEventListener('click', function() {
                    searchInput.value = matchedMovie.title;
                    suggestionsBox.classList.add('dropdown-hidden');
                    toggleClearButton();
                    clearActiveStates();
                    isSearchMode = true;
                    sectionTitle.textContent = 'Search Results';
                    fetchMovies('/search/movie', '&query=' + encodeURIComponent(matchedMovie.title));
                });

                suggestionsBox.appendChild(dropItem);
            }
            suggestionsBox.classList.remove('dropdown-hidden');

        } catch (err) {
            suggestionsBox.classList.add('dropdown-hidden');
        }
    }

    function buildClearButton() {
        clearInputBtn = document.createElement('button');
        clearInputBtn.type = 'button';
        clearInputBtn.className = 'clear-btn';
        clearInputBtn.textContent = '×';
        
        searchInput.parentNode.insertBefore(clearInputBtn, suggestionsBox);

        clearInputBtn.addEventListener('click', function() {
            searchInput.value = '';
            suggestionsBox.classList.add('dropdown-hidden');
            toggleClearButton();
            searchInput.focus();
        });
    }

    function toggleClearButton() {
        if (searchInput.value.length > 0) {
            clearInputBtn.style.display = 'block';
        } else {
            clearInputBtn.style.display = 'none';
        }
    }

    function closeMobileMenu() {
        navMenu.classList.add('menu-hidden');
        menuToggleBtn.classList.remove('menu-active');
    }

    menuToggleBtn.addEventListener('click', function() {
        navMenu.classList.toggle('menu-hidden');
        menuToggleBtn.classList.toggle('menu-active');
    });

    loadMoreBtn.addEventListener('click', function() {
        currentPage++;
        fetchMovies(currentEndpoint, currentQueryParam, true);
    });

    searchInput.addEventListener('input', function() {
        toggleClearButton();
        clearTimeout(debounceTimer);
        const searchString = searchInput.value.trim();

        debounceTimer = setTimeout(function() {
            fetchLiveSearchSuggestions(searchString);
        }, 400);
    });

    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (!query) {
            alert('Please enter a movie name.');
            return;
        }

        suggestionsBox.classList.add('dropdown-hidden');
        clearActiveStates();
        isSearchMode = true;
        sectionTitle.textContent = 'Search Results';
        fetchMovies('/search/movie', '&query=' + encodeURIComponent(query));
        closeMobileMenu();
    });

    navHome.addEventListener('click', function(e) {
        e.preventDefault();
        clearActiveStates();
        navHome.classList.add('active-filter');
        searchInput.value = '';
        toggleClearButton();
        isSearchMode = false;
        sectionTitle.textContent = 'Popular Movies';
        fetchMovies('/movie/popular');
        closeMobileMenu();
    });

    navPopular.addEventListener('click', function(e) {
        e.preventDefault();
        clearActiveStates();
        navPopular.classList.add('active-filter');
        searchInput.value = '';
        toggleClearButton();
        isSearchMode = false;
        sectionTitle.textContent = 'Popular Movies';
        fetchMovies('/movie/popular');
        closeMobileMenu();
    });

    navTopRated.addEventListener('click', function(e) {
        e.preventDefault();
        clearActiveStates();
        navTopRated.classList.add('active-filter');
        searchInput.value = '';
        toggleClearButton();
        isSearchMode = false;
        sectionTitle.textContent = 'Top Rated Movies';
        fetchMovies('/movie/top_rated');
        closeMobileMenu();
    });

    modalClose.addEventListener('click', closeModalWindow);

    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModalWindow();
        }
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && !modal.classList.contains('modal-hidden')) {
            closeModalWindow();
        }
    });

    document.addEventListener('click', function(event) {
        if (!searchForm.contains(event.target)) {
            suggestionsBox.classList.add('dropdown-hidden');
        }
    });

    function initApp() {
        if (!API_KEY || API_KEY === '') {
            errorMsg.textContent = 'API key not configured.';
            errorMsg.classList.remove('error-hidden');
            return;
        }
        buildClearButton();
        fetchGenresList().then(function() {
            fetchMovies('/movie/popular');
        });
    }

    document.addEventListener('DOMContentLoaded', initApp); 