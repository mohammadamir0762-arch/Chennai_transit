export function buildMockRoutes(from, to) {
  return [
    {
      duration_minutes: 42,
      legs: [
        { mode: "WALK", duration_minutes: 5, instructions: `Walk to ${from}`, from_lat: 12.9716, from_lng: 77.5946, to_lat: 12.9716, to_lng: 77.5946 },
        {
          mode: "BUS",
          line_name: "42A",
          from_stop: "Main St",
          to_stop: "Central Station",
          departure_time: "14:05",
          arrival_time: "14:28",
          from_lat: 12.9716, from_lng: 77.5946,
          to_lat: 12.9762, to_lng: 77.6033,
        },
        { mode: "WALK", duration_minutes: 3, instructions: `Walk to ${to}`, from_lat: 12.9762, from_lng: 77.6033, to_lat: 12.9762, to_lng: 77.6033 },
      ],
    },
    {
      duration_minutes: 51,
      legs: [
        { mode: "WALK", duration_minutes: 6, instructions: `Walk to ${from}`, from_lat: 12.9716, from_lng: 77.5946, to_lat: 12.9698, to_lng: 77.5875 },
        {
          mode: "BUS",
          line_name: "7B",
          from_stop: "Market Square",
          to_stop: "University Gate",
          departure_time: "14:10",
          arrival_time: "14:32",
          from_lat: 12.9698, from_lng: 77.5875,
          to_lat: 12.9805, to_lng: 77.5911,
        },
        {
          mode: "TRAIN",
          line_name: "Purple Line",
          from_stop: "University Gate",
          to_stop: "Central Station",
          departure_time: "14:38",
          arrival_time: "14:52",
          from_lat: 12.9805, from_lng: 77.5911,
          to_lat: 12.9762, to_lng: 77.6033,
        },
        { mode: "WALK", duration_minutes: 4, instructions: `Walk to ${to}`, from_lat: 12.9762, from_lng: 77.6033, to_lat: 12.9762, to_lng: 77.6033 },
      ],
    },
  ];
}
