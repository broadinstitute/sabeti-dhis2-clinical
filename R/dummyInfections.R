# Generating a csv of random infection cases in a period of two months

# Generating the two days datasets
set.seed(43)
days1 <- round(rnorm(100, mean = 25, sd = 2))
days2 <- round(rnorm(100, mean = 0, sd = 4))

# Turning negative days into days of previous month
toPrevMonth <- function(vect) {
  toMay <- c()
  toJune <- c()
  for (i in 1:length(vect)) {
    if (vect[i] <= 0) {
      toMay <- append(toMay, vect[i] + 31)
    } else {
      toJune <- append(toJune, vect[i])
    }
  }
  return(list("toMay" = toMay, "toJune" = toJune))
}

listOfVectors <- toPrevMonth(days2)


# Clean days variable asignment
D1a <- days1
D1b <- listOfVectors$toMay
D2 <- listOfVectors$toJune

 
# Create dates for May and June
dates1a <- as.Date(sprintf("2014-05-%d", D1a))
dates1b <- as.Date(sprintf("2014-05-%d", D1b))
dates2 <- as.Date(sprintf("2014-06-%d", D2))

# create random locations

#for town 1
lat1 <- seq(7.6, 8.3, by = 0.03)
lng1 <- seq(-12.14, -11.3, by = 0.03)

# for town 2
lat2 <- seq(7.6, 8.2, by = 0.03)
lng2 <- seq(-11.5, -10.6, by = 0.03)


# sampling to create coordinates
c1 <- list('lat' = sample(lat1, length(dates1a), T),
           'lng' = sample(lng1, length(dates1a), T))


c2a <- list('lat' = sample(lat2, length(dates1b), T),
           'lng' = sample(lng2, length(dates1b), T))

c2b <- list('lat' = sample(lat2, length(dates2), T),
            'lng' = sample(lng2, length(dates2), T))


# randomly assign GenBank IDs
seqID <- c('KR105295.1', 'KR105294.1', 'KR105266.1', 'KR105263.1', 'KR105318.1', 'KR105317.1', 'KR105316.1', 'KR105312.1',
           'KR105311.1', 'KR105310.1', 'KR105308.1', 'KR105306.1', ' KR105300.1', 'KR105293.1', 'KR105285.1', 'KR105284.1')

sequence <- sample(seqID, 200, T)

# dataframes
town1 <- data.frame(eventDate = dates1a, town = 'Bo', lat = c1$lat, lng = c1$lng, age = sample(30:60, length(dates1a), T))
town2a <- data.frame(eventDate = dates1b, town = 'Kenema', lat = c2a$lat, lng = c2a$lng, age = sample(30:60, length(dates1b), T))
town2b <- data.frame(eventDate = dates2, town = 'Kenema', lat = c2b$lat, lng = c2b$lng, age = sample(30:60, length(dates2), T))
allcases <- rbind(town1, town2a, town2b)
allcases <- cbind(allcases, sequence)


library(scales)
library(ggplot2)
ggplot(allcases, aes(x=eventDate, fill=town)) +
  stat_bin(binwidth=1, position="identity") +
  scale_x_date(breaks=date_breaks(width="1 day"))


write.csv(allcases, file = "~/projects/web-dhis2/dummyDataV2.csv")
