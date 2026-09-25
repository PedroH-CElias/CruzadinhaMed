package com.cruzadinha.med.projections;

public interface UserDetailsProjection {
	
	String getUsername();

	String getPassword();

	Long getRoleId();

	String getAuthority();

}
