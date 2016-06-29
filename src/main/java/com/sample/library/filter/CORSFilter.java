package com.sample.library.filter;

import java.io.IOException;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class CORSFilter {
	private static final String ORIGIN = "Origin";

	public CORSFilter() {
	}

	public void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws IOException, ServletException {
		HttpServletResponse response = (HttpServletResponse) res;

		if (req.getHeader(ORIGIN) != null) {

			response.setHeader("Access-Control-Allow-Origin", "*");
			response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");
			response.setHeader("Access-Control-Max-Age", "3600");

			String reqHead = req.getHeader("Access-Control-Request-Headers");

			// if (!StringUtils.isEmpty(reqHead)) {
			if (reqHead != null && reqHead.trim().length() > 0) {
				response.addHeader("Access-Control-Allow-Headers", reqHead);
			}
		}

		if (req.getMethod().equals("OPTIONS")) {
			try {
				response.getWriter().print("OK");
				response.getWriter().flush();
			} catch (IOException e) {
				e.printStackTrace();
			}
		} else {
			chain.doFilter(req, response);
		}
	}

	public void destroy() {
	}
}
