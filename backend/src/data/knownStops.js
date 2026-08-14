// Real Chennai Suburban Railway / MRTS stations, mirrored from the GTFS
// feed in otp/chennai/chennai-gtfs.zip (source: github.com/justjkk/chennai-rail-gtfs).
// Doubles as a stand-in for geocoding until Nominatim is wired up (see
// docs/this-spec.md section 6.1) — /api/route resolves free-text "from"/"to"
// against this list. MTC bus stops aren't included yet — that feed requires
// a Transitland API key to fetch (see otp/chennai/README.md).
export const knownStops = [
  { id: "Chengalpattu Jn.", name: "Chengalpattu Jn.", lat: 12.693333, lng: 79.981111 },
  { id: "Chennai Beach", name: "Chennai Beach", lat: 13.093889, lng: 80.2925 },
  { id: "Chennai Egmore", name: "Chennai Egmore", lat: 13.077778, lng: 80.260278 },
  { id: "Chennai Fort", name: "Chennai Fort", lat: 13.083056, lng: 80.2825 },
  { id: "Chennai Park", name: "Chennai Park", lat: 13.080556, lng: 80.273056 },
  { id: "Chepauk", name: "Chepauk", lat: 13.061667, lng: 80.280278 },
  { id: "Chetpet", name: "Chetpet", lat: 13.074167, lng: 80.2425 },
  { id: "Chintadripet", name: "Chintadripet", lat: 13.073611, lng: 80.274444 },
  { id: "Chromepet", name: "Chromepet", lat: 12.951667, lng: 80.141111 },
  { id: "Greenways Road", name: "Greenways Road", lat: 13.021944, lng: 80.252778 },
  { id: "Guduvancheri", name: "Guduvancheri", lat: 12.845556, lng: 80.057222 },
  { id: "Guindy", name: "Guindy", lat: 13.008611, lng: 80.212778 },
  { id: "Indira Nagar", name: "Indira Nagar", lat: 12.996944, lng: 80.248889 },
  { id: "Kanchipuram", name: "Kanchipuram", lat: 12.817222, lng: 79.7025 },
  { id: "Kasturba Nagar", name: "Kasturba Nagar", lat: 13.006389, lng: 80.247778 },
  { id: "Kattangulathur", name: "Kattangulathur", lat: 12.805833, lng: 80.026667 },
  { id: "Kodambakkam", name: "Kodambakkam", lat: 13.051389, lng: 80.230556 },
  { id: "Kotturpuram", name: "Kotturpuram", lat: 13.013889, lng: 80.248056 },
  { id: "Light House", name: "Light House", lat: 13.043889, lng: 80.276111 },
  { id: "Mambalam", name: "Mambalam", lat: 13.0375, lng: 80.2275 },
  { id: "Mandaveli", name: "Mandaveli", lat: 13.026944, lng: 80.260278 },
  { id: "Maraimalai Nagar", name: "Maraimalai Nagar", lat: 12.796667, lng: 80.020278 },
  { id: "Minambakkam", name: "Minambakkam", lat: 12.984444, lng: 80.175 },
  { id: "Nungambakkam", name: "Nungambakkam", lat: 13.065556, lng: 80.232778 },
  { id: "Palavanthangal", name: "Palavanthangal", lat: 12.990278, lng: 80.188056 },
  { id: "Pallavaram", name: "Pallavaram", lat: 12.967778, lng: 80.152222 },
  { id: "Palur", name: "Palur", lat: 12.983889, lng: 79.669167 },
  { id: "Paranur", name: "Paranur", lat: 12.73, lng: 79.983889 },
  { id: "Park Town", name: "Park Town", lat: 13.079722, lng: 80.2775 },
  { id: "Perungudi", name: "Perungudi", lat: 12.975, lng: 80.231111 },
  { id: "Perungulathur", name: "Perungulathur", lat: 12.905, lng: 80.095 },
  { id: "Potheri", name: "Potheri", lat: 12.821389, lng: 80.036944 },
  { id: "Saidapet", name: "Saidapet", lat: 13.023333, lng: 80.223889 },
  { id: "Singaperumal koil", name: "Singaperumal koil", lat: 12.761667, lng: 80.000556 },
  { id: "St. Thomas Mount", name: "St. Thomas Mount", lat: 12.994722, lng: 80.199444 },
  { id: "Tambaram", name: "Tambaram", lat: 12.925833, lng: 80.118333 },
  { id: "Tambaram Sanatorium", name: "Tambaram Sanatorium", lat: 12.937778, lng: 80.131389 },
  { id: "Tharamani", name: "Tharamani", lat: 12.978611, lng: 80.240833 },
  { id: "Thirumayilai", name: "Thirumayilai", lat: 13.035556, lng: 80.2675 },
  { id: "Thiruvanmiyur", name: "Thiruvanmiyur", lat: 12.988056, lng: 80.251111 },
  { id: "Tirumalpur", name: "Tirumalpur", lat: 12.567222, lng: 79.4025 },
  { id: "Tirusulam", name: "Tirusulam", lat: 12.980278, lng: 80.165833 },
  { id: "Tiruvellikeni", name: "Tiruvellikeni", lat: 13.055278, lng: 80.280833 },
  { id: "Urappakkam", name: "Urappakkam", lat: 12.868056, lng: 80.0725 },
  { id: "Vandalur", name: "Vandalur", lat: 12.891111, lng: 80.084444 },
  { id: "Velachery", name: "Velachery", lat: 12.967222, lng: 80.219444 },
  { id: "Walajabad", name: "Walajabad", lat: 12.783889, lng: 79.819167 },
];

export function findStopByName(query) {
  const q = query.trim().toLowerCase();
  return (
    knownStops.find((s) => s.name.toLowerCase() === q) ||
    knownStops.find((s) => s.name.toLowerCase().includes(q))
  );
}
