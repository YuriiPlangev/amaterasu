import axios from 'axios';

export const wp = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_WP_URL}/wp-json/wp/v2`,
});
